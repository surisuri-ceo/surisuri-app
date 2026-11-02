import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://sdhewingffatmkjbevzm.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_oAmBLKt8N297K3vGadGYIA_JGOHVs83';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
