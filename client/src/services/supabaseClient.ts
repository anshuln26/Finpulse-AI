import { createClient } from '@supabase/supabase-js';

// Fallback to configured FinPulse Supabase project so it works out of the box on both Vercel and local
const supabaseUrl =
  (import.meta.env.VITE_SUPABASE_URL as string) ||
  'https://kfucjddpfmyjotnwqxzb.supabase.co';

const supabaseAnonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ||
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string) ||
  'sb_publishable_9OQhnQjG2dcKZJixevjxjQ_xrfIvqSQ';

export const isSupabaseConfigured = (): boolean => {
  return (
    typeof supabaseUrl === 'string' &&
    supabaseUrl.trim() !== '' &&
    !supabaseUrl.includes('your-project-ref') &&
    typeof supabaseAnonKey === 'string' &&
    supabaseAnonKey.trim() !== '' &&
    !supabaseAnonKey.includes('your-anon')
  );
};

export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;
