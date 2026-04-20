import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

console.log('[Supabase] Initializing with:', {
  url: SUPABASE_URL,
  hasKey: !!SUPABASE_PUBLISHABLE_KEY,
  keyPrefix: SUPABASE_PUBLISHABLE_KEY?.substring(0, 10)
});

// Validate environment variables at startup
if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error(
    "Missing required environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY must be set",
  );
}

// Validate URL format
try {
  new URL(SUPABASE_URL);
} catch {
  throw new Error("VITE_SUPABASE_URL must be a valid URL");
}

export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      debug: true,
    },
    global: {
      headers: {
        'X-Client-Info': 'flowbooks-web',
      },
    },
  },
);

console.log('[Supabase] Client created successfully');
