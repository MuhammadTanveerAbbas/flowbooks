import type { IncomingMessage, ServerResponse } from "node:http";
import {
  checkSupabaseHealth,
  requireBearer,
  sendJson,
  SupabaseConfigurationError,
} from "./_shared.js";

export default async function handler(
  request: IncomingMessage,
  response: ServerResponse,
) {
  if (request.method !== "GET") {
    sendJson(response, 405, { error: "Method not allowed" });
    return;
  }

  if (!requireBearer(request, process.env.CRON_SECRET)) {
    sendJson(response, 401, { error: "Unauthorized" });
    return;
  }

  try {
    await checkSupabaseHealth();
  } catch (error) {
    if (error instanceof SupabaseConfigurationError) {
      sendJson(response, 500, {
        status: "error",
        timestamp: new Date().toISOString(),
      });
      return;
    }

    sendJson(response, 503, {
      status: "error",
      dependency: "supabase",
      timestamp: new Date().toISOString(),
    });
    return;
  }

  sendJson(response, 200, {
    status: "ok",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? "unknown",
  });
}