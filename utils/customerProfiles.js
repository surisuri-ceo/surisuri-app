const profileColumns = 'id, auth_user_id, role, name, phone, region, bio, created_at';

export function findProfile(supabase, authUserId) {
  return supabase
    .from('profiles')
    .select(profileColumns)
    .eq('auth_user_id', authUserId)
    .maybeSingle();
}

export async function createCustomerProfile(supabase, authUserId, { realName, phone, address }) {
  const name = realName.trim();
  const phoneNumber = phone.trim();
  const region = address.trim();
  if (!authUserId || !name || !phoneNumber || !region) {
    return { data: null, error: { code: 'MISSING_PROFILE_FIELDS' } };
  }

  const result = await supabase
    .from('profiles')
    .insert({
      auth_user_id: authUserId,
      role: 'customer',
      name,
      phone: phoneNumber,
      region,
    })
    .select(profileColumns)
    .single();

  // A concurrent submission may already have created this account's profile.
  if (result.error?.code === '23505') {
    const existing = await findProfile(supabase, authUserId);
    return existing.data || existing.error ? existing : result;
  }

  return result;
}
