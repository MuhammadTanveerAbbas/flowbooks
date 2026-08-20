import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@supabase/supabase-js";
import {
  checkSupabaseHealth,
  SupabaseConfigurationError,
} from "../../api/_shared";

const mockedCreateClient = vi.mocked(createClient);

function stubSupabase(limitResult: unknown) {
  const limit = vi.fn().mockResolvedValue(limitResult);
  const select = vi.fn().mockReturnValue({ limit });
  const from = vi.fn().mockReturnValue({ select });
  mockedCreateClient.mockReturnValue({
    from,
  } as never);
  return { from, select, limit };
}

beforeEach(() => {
  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
});

afterEach(() => {
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  vi.clearAllMocks();
});

describe("checkSupabaseHealth", () => {
  it("performs a single lightweight read-only request on success", async () => {
    const { from, select, limit } = stubSupabase({ data: [], error: null });

    await expect(checkSupabaseHealth()).resolves.toBeUndefined();

    expect(from).toHaveBeenCalledWith("profiles");
    expect(select).toHaveBeenCalledWith("id");
    expect(limit).toHaveBeenCalledWith(1);
    expect(limit).toHaveBeenCalledTimes(1);
  });

  it("recovers from a transient failure and retries", async () => {
    const { limit } = stubSupabase({ data: [], error: null });
    limit
      .mockResolvedValueOnce({ data: null, error: { message: "server error", status: 503 } })
      .mockResolvedValueOnce({ data: [], error: null });

    await expect(checkSupabaseHealth()).resolves.toBeUndefined();
    expect(limit).toHaveBeenCalledTimes(2);
  });

  it("retries an aborted (timeout) request and recovers", async () => {
    const { limit } = stubSupabase({ data: [], error: null });
    limit
      .mockResolvedValueOnce({
        data: null,
        error: { message: "AbortError: The user aborted a request.", status: 0 },
      })
      .mockResolvedValueOnce({ data: [], error: null });

    await expect(checkSupabaseHealth()).resolves.toBeUndefined();
    expect(limit).toHaveBeenCalledTimes(2);
  });

  it("fails after bounded retries when the service stays unavailable", async () => {
    const { limit } = stubSupabase({ data: [], error: null });
    limit.mockResolvedValue({
      data: null,
      error: { message: "unavailable", status: 503 },
    });

    await expect(checkSupabaseHealth()).rejects.toEqual({
      message: "unavailable",
      status: 503,
    });
    expect(limit).toHaveBeenCalledTimes(3);
  });

  it("fails immediately on permanent configuration errors", async () => {
    const { limit } = stubSupabase({ data: [], error: null });
    limit.mockResolvedValue({
      data: null,
      error: { message: "unauthorized", status: 401 },
    });

    await expect(checkSupabaseHealth()).rejects.toEqual({
      message: "unauthorized",
      status: 401,
    });
    expect(limit).toHaveBeenCalledTimes(1);
  });

  it("throws a configuration error when server env vars are missing", async () => {
    delete process.env.SUPABASE_URL;

    await expect(checkSupabaseHealth()).rejects.toThrow(SupabaseConfigurationError);
    expect(mockedCreateClient).not.toHaveBeenCalled();
  });
});