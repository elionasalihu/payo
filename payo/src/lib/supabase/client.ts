import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Next.js only exposes variables that start with NEXT_PUBLIC_ to the browser.
// They must be written out literally so they are inlined at build time.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured && typeof window !== "undefined") {
  console.warn(
    "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local."
  );
}

// Only the public anon key is used. Data access is enforced by Row Level Security.
// The client is created only in the browser (the whole app runs as Client Components),
// where the session is stored in localStorage.
export const supabase: SupabaseClient | null =
  isSupabaseConfigured && typeof window !== "undefined"
    ? createClient(supabaseUrl as string, supabaseAnonKey as string, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    : null;
