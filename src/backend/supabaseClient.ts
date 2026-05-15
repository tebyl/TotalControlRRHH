import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const SUPABASE_CONFIGURED = Boolean(url && key);

// Falls back to a no-op client when env vars are absent (offline / dev without .env)
export const supabase = SUPABASE_CONFIGURED
  ? createClient(url!, key!)
  : createClient("https://placeholder.supabase.co", "placeholder");
