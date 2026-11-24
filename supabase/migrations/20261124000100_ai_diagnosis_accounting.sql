-- Draft for review. Accounting uses integer micro-USD and Asia/Seoul admission days.
begin;

create schema if not exists ai_diagnosis_private;
revoke all on schema ai_diagnosis_private from public, anon, authenticated, service_role;

create table ai_diagnosis_private.control (
  singleton boolean primary key default true check (singleton),
  enabled boolean not null default false
);
insert into ai_diagnosis_private.control default values;

create table ai_diagnosis_private.daily_budget (
  budget_day date primary key,
  committed_micros bigint not null default 0 check (committed_micros >= 0),
  blocked boolean not null default false
);

create table ai_diagnosis_private.requests (
  user_id uuid not null,
  request_id text not null check (request_id ~ '^[a-zA-Z0-9_-]{16,100}$'),
  fingerprint text not null check (fingerprint ~ '^[a-f0-9]{64}$'),
  trace_id uuid not null unique default gen_random_uuid(),
  provider_request_id text check (provider_request_id ~ '^[a-zA-Z0-9_-]{1,128}$'),
  budget_day date not null references ai_diagnosis_private.daily_budget,
  status text not null check (status in ('processing', 'unknown', 'completed', 'failed')),
  reserved_micros bigint not null check (reserved_micros > 0),
  actual_micros bigint check (actual_micros >= 0),
  input_tokens integer check (input_tokens >= 0),
  output_tokens integer check (output_tokens >= 0),
  result jsonb,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  primary key (user_id, request_id),
  check ((status = 'completed') = (result is not null)),
  check ((status in ('completed', 'failed')) = (actual_micros is not null))
);

create table ai_diagnosis_private.reconciliations (
  trace_id uuid primary key references ai_diagnosis_private.requests(trace_id),
  evidence_reference text not null check (evidence_reference ~ '^[a-zA-Z0-9_.:-]{3,160}$'),
  operator_name text not null default session_user,
  reconciled_at timestamptz not null default clock_timestamp()
);

create index ai_diagnosis_user_daily on ai_diagnosis_private.requests (user_id, budget_day);
create unique index ai_diagnosis_one_active_per_user on ai_diagnosis_private.requests (user_id)
  where status in ('processing', 'unknown');

alter table ai_diagnosis_private.daily_budget enable row level security;
alter table ai_diagnosis_private.requests enable row level security;
alter table ai_diagnosis_private.control enable row level security;
alter table ai_diagnosis_private.reconciliations enable row level security;
revoke all on all tables in schema ai_diagnosis_private from public, anon, authenticated, service_role;

-- Definer RPCs are callable only by the trusted Edge Function's server credential.
-- The handler supplies the UID obtained directly from Supabase Auth.
create function public.reserve_repair_diagnosis(p_uid uuid, p_request_id text, p_fingerprint text)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_day date;
  v_existing ai_diagnosis_private.requests%rowtype;
  v_reserved constant bigint := 50000;
  v_budget constant bigint := 1000000;
  v_used bigint;
  v_blocked boolean;
  v_trace_id uuid;
begin
  perform pg_catalog.pg_advisory_xact_lock(184424, 1);
  v_day := (pg_catalog.clock_timestamp() at time zone 'Asia/Seoul')::date;

  -- A worker crash can leave processing rows. Preserve the charge reservation and active slot.
  update ai_diagnosis_private.requests set status = 'unknown', updated_at = clock_timestamp()
  where user_id = p_uid and status = 'processing' and created_at < clock_timestamp() - interval '2 minutes';

  select * into v_existing from ai_diagnosis_private.requests
  where user_id = p_uid and request_id = p_request_id;
  if found then
    if v_existing.fingerprint <> p_fingerprint then
      return jsonb_build_object('decision', 'conflict');
    end if;
    if v_existing.status = 'completed' then
      return jsonb_build_object('decision', 'completed', 'result', v_existing.result);
    end if;
    return jsonb_build_object('decision', v_existing.status);
  end if;
  -- The operator's switch takes the same transaction lock as admission.
  if not exists (select 1 from ai_diagnosis_private.control where singleton and enabled) then
    return jsonb_build_object('decision', 'disabled');
  end if;
  if exists (select 1 from ai_diagnosis_private.requests
      where user_id = p_uid and status in ('processing', 'unknown')) then
    return jsonb_build_object('decision', 'active');
  end if;
  if (select count(*) from ai_diagnosis_private.requests where user_id = p_uid and budget_day = v_day) >= 5 then
    return jsonb_build_object('decision', 'user_limit');
  end if;
  insert into ai_diagnosis_private.daily_budget (budget_day) values (v_day) on conflict do nothing;
  select committed_micros, blocked into v_used, v_blocked
  from ai_diagnosis_private.daily_budget where budget_day = v_day;
  if v_blocked or v_used + v_reserved > v_budget then
    return jsonb_build_object('decision', 'budget_limit');
  end if;

  update ai_diagnosis_private.daily_budget set committed_micros = committed_micros + v_reserved
  where budget_day = v_day;
  insert into ai_diagnosis_private.requests
    (user_id, request_id, fingerprint, budget_day, status, reserved_micros)
  values (p_uid, p_request_id, p_fingerprint, v_day, 'processing', v_reserved)
  returning trace_id into v_trace_id;
  return jsonb_build_object('decision', 'reserved', 'traceId', v_trace_id);
end;
$$;

create function public.finish_repair_diagnosis(
  p_uid uuid, p_request_id text, p_status text,
  p_cost bigint, p_input_tokens integer, p_output_tokens integer, p_result jsonb,
  p_provider_request_id text
)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  v_request ai_diagnosis_private.requests%rowtype;
begin
  perform pg_catalog.pg_advisory_xact_lock(184424, 1);
  select * into v_request from ai_diagnosis_private.requests
  where user_id = p_uid and request_id = p_request_id;
  if not found or v_request.status not in ('processing', 'unknown') then
    return false;
  end if;
  if p_status = 'unknown' then
    update ai_diagnosis_private.requests set status = 'unknown', updated_at = clock_timestamp(),
      provider_request_id = coalesce(p_provider_request_id, provider_request_id)
    where user_id = p_uid and request_id = p_request_id;
    return true;
  end if;
  if p_status is null or p_status not in ('completed', 'failed') or
     p_cost is null or p_cost < 0 or p_input_tokens is null or p_input_tokens < 0 or
     p_output_tokens is null or p_output_tokens < 0 or ((p_status = 'completed') <> (p_result is not null)) then
    raise exception 'invalid diagnosis settlement';
  end if;

  -- Record actual usage even if a provider rate/usage change exceeded the estimate.
  update ai_diagnosis_private.daily_budget
  set committed_micros = committed_micros - v_request.reserved_micros + p_cost,
      blocked = blocked or p_cost > v_request.reserved_micros
  where budget_day = v_request.budget_day;
  update ai_diagnosis_private.requests
  set status = p_status, actual_micros = p_cost, input_tokens = p_input_tokens,
      output_tokens = p_output_tokens, result = p_result, updated_at = clock_timestamp(),
      provider_request_id = coalesce(p_provider_request_id, provider_request_id)
  where user_id = p_uid and request_id = p_request_id;
  return true;
end;
$$;

create function public.repair_diagnosis_status(p_uid uuid, p_request_id text)
returns text
language sql stable security definer set search_path = ''
as $$
  select case when status = 'processing' and created_at < pg_catalog.statement_timestamp() - interval '2 minutes'
              then 'unknown' else status end
  from ai_diagnosis_private.requests where user_id = p_uid and request_id = p_request_id;
$$;

-- Run only through a trusted database operator session, with evidence from the provider or billing records.
create function ai_diagnosis_private.reconcile_unknown(
  p_trace_id uuid, p_evidence_reference text, p_actual_micros bigint,
  p_input_tokens integer, p_output_tokens integer
)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  v_row ai_diagnosis_private.requests%rowtype;
begin
  perform pg_catalog.pg_advisory_xact_lock(184424, 1);
  select * into v_row from ai_diagnosis_private.requests where trace_id = p_trace_id
    and (status = 'unknown' or (status = 'processing' and created_at < clock_timestamp() - interval '2 minutes'));
  if not found then return false; end if;
  insert into ai_diagnosis_private.reconciliations (trace_id, evidence_reference)
  values (p_trace_id, p_evidence_reference);
  if not public.finish_repair_diagnosis(v_row.user_id, v_row.request_id, 'failed',
      p_actual_micros, p_input_tokens, p_output_tokens, null, v_row.provider_request_id) then
    raise exception 'reconciliation failed';
  end if;
  return true;
end;
$$;

create function ai_diagnosis_private.set_enabled(p_enabled boolean)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  perform pg_catalog.pg_advisory_xact_lock(184424, 1);
  update ai_diagnosis_private.control set enabled = p_enabled where singleton;
end;
$$;

revoke all on function public.reserve_repair_diagnosis(uuid, text, text) from public, anon, authenticated;
revoke all on function public.finish_repair_diagnosis(uuid, text, text, bigint, integer, integer, jsonb, text)
  from public, anon, authenticated;
revoke all on function public.repair_diagnosis_status(uuid, text) from public, anon, authenticated;
revoke all on function ai_diagnosis_private.reconcile_unknown(uuid, text, bigint, integer, integer)
  from public, anon, authenticated, service_role;
revoke all on function ai_diagnosis_private.set_enabled(boolean) from public, anon, authenticated, service_role;
grant execute on function public.reserve_repair_diagnosis(uuid, text, text) to service_role;
grant execute on function public.finish_repair_diagnosis(uuid, text, text, bigint, integer, integer, jsonb, text)
  to service_role;
grant execute on function public.repair_diagnosis_status(uuid, text) to service_role;

commit;
