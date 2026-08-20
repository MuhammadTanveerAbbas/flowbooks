import { createClient } from "@supabase/supabase-js";
import type { IncomingMessage, ServerResponse } from "node:http";
import {
  fetchWithTimeout,
  RELIABILITY_DEFAULTS,
  withRetry,
} from "./reliability.js";

const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

export function sendJson(
  response: ServerResponse,
  statusCode: number,
  body: Record<string, unknown>,
) {
  response.writeHead(statusCode, jsonHeaders);
  response.end(JSON.stringify(body));
}

export function requireBearer(
  request: IncomingMessage,
  expectedSecret: string | undefined,
): boolean {
  const authHeader = request.headers.authorization;
  return Boolean(expectedSecret && authHeader === `Bearer ${expectedSecret}`);
}

export class SupabaseConfigurationError extends Error {
  constructor() {
    super("Missing Supabase server environment variables");
    this.name = "SupabaseConfigurationError";
  }
}

export function createServerSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new SupabaseConfigurationError();
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      fetch: fetchWithTimeout(RELIABILITY_DEFAULTS.timeoutMs),
    },
  });
}

/**
 * Lightweight read-only connectivity check against an existing resource.
 * Uses bounded retries for transient failures so a brief Supabase blip does
 * not report a false outage, while permanent/config errors surface directly.
 */
export async function checkSupabaseHealth(): Promise<void> {
  const supabase = createServerSupabaseClient();
  await withRetry(async () => {
    const { error } = await supabase.from("profiles").select("id").limit(1);
    if (error) throw error;
  });
}