import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error(
    "Missing required environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY must be set",
  );
}

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
      // Verbose auth logs help while developing, but would flood the test
      // runner output, so keep them out of the vitest environment.
      debug: import.meta.env.DEV && import.meta.env.MODE !== 'test',
    },
    global: {
      headers: {
        'X-Client-Info': 'flowbooks-web',
      },
    },
  },
);
