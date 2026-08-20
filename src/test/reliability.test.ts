import { afterEach, describe, expect, it, vi } from "vitest";
import {
  backoffDelay,
  fetchWithTimeout,
  isTransientError,
  withRetry,
} from "../../api/reliability";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("backoffDelay", () => {
  it("grows exponentially and is capped by maxDelayMs", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    expect(backoffDelay(0, 100, 1000)).toBe(100);
    expect(backoffDelay(1, 100, 1000)).toBe(200);
    expect(backoffDelay(2, 100, 1000)).toBe(400);
    expect(backoffDelay(3, 100, 1000)).toBe(800);
    expect(backoffDelay(4, 100, 1000)).toBe(1000);
    expect(backoffDelay(10, 100, 1000)).toBe(1000);
  });

  it("applies jitter within the 0.5x-1.5x window", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    expect(backoffDelay(0, 100, 1000)).toBe(50);

    vi.spyOn(Math, "random").mockReturnValue(0.999);
    expect(backoffDelay(0, 100, 1000)).toBe(150);
  });
});

describe("isTransientError", () => {
  it("treats HTTP 429 and 5xx as transient", () => {
    expect(isTransientError({ message: "rate limited", status: 429 })).toBe(true);
    expect(isTransientError({ message: "server error", status: 500 })).toBe(true);
    expect(isTransientError({ message: "bad gateway", status: 502 })).toBe(true);
    expect(isTransientError({ message: "unavailable", status: 503 })).toBe(true);
  });

  it("treats auth/validation errors as permanent", () => {
    expect(isTransientError({ message: "unauthorized", status: 401 })).toBe(false);
    expect(isTransientError({ message: "forbidden", status: 403 })).toBe(false);
    expect(isTransientError({ message: "bad request", status: 400 })).toBe(false);
  });

  it("treats aborted and network failures as transient", () => {
    expect(
      isTransientError({ message: "AbortError: The user aborted a request.", status: 0 }),
    ).toBe(true);
    expect(isTransientError({ message: "TypeError: fetch failed", status: 0 })).toBe(true);
    expect(isTransientError({ message: "FetchError: failed", status: 0 })).toBe(true);
    expect(isTransientError(new DOMException("aborted", "AbortError"))).toBe(true);
    expect(isTransientError(new TypeError("fetch failed"))).toBe(true);
  });

  it("treats Supabase connection errors as transient", () => {
    expect(
      isTransientError({ message: "connection refused", status: 503, code: "PGRST301" }),
    ).toBe(true);
  });

  it("treats other errors as permanent", () => {
    expect(isTransientError(new Error("boom"))).toBe(false);
    expect(isTransientError("oops")).toBe(false);
    expect(isTransientError(null)).toBe(false);
    expect(isTransientError(undefined)).toBe(false);
    expect(isTransientError({ message: "bad key" })).toBe(false);
  });
});

describe("withRetry", () => {
  it("returns a successful result without retrying", async () => {
    const fn = vi.fn(async () => "ok");
    await expect(withRetry(fn, { baseDelayMs: 1 })).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries transient failures and then succeeds", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce({ status: 503, message: "temporary" })
      .mockResolvedValueOnce("ok");
    await expect(withRetry(fn, { baseDelayMs: 1 })).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("stops retrying after maxRetries and rethrows", async () => {
    const err = { status: 503, message: "persistent" };
    const fn = vi.fn().mockRejectedValue(err);
    await expect(withRetry(fn, { maxRetries: 2, baseDelayMs: 1 })).rejects.toBe(err);
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("does not retry permanent failures", async () => {
    const err = { status: 401, message: "unauthorized" };
    const fn = vi.fn().mockRejectedValueOnce(err).mockResolvedValueOnce("ok");
    await expect(withRetry(fn, { baseDelayMs: 1 })).rejects.toBe(err);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("stops as soon as a failure becomes permanent", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce({ status: 503 })
      .mockRejectedValueOnce({ status: 401 });
    await expect(withRetry(fn, { maxRetries: 3, baseDelayMs: 1 })).rejects.toEqual({
      status: 401,
    });
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("honors a custom transient predicate", async () => {
    const fn = vi.fn().mockRejectedValueOnce("special").mockResolvedValueOnce("ok");
    await expect(
      withRetry(fn, { baseDelayMs: 1, isTransient: (e) => e === "special" }),
    ).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe("fetchWithTimeout", () => {
  it("aborts the request when it exceeds the timeout", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn(
      (_input: RequestInfo | URL, init?: RequestInit) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(new DOMException("The operation was aborted", "AbortError"));
          });
        }),
    ) as unknown as typeof fetch;
    try {
      const fetchWithTimeoutFn = fetchWithTimeout(25);
      const error = await fetchWithTimeoutFn("https://example.com").catch((e) => e);
      expect(error.name).toBe("AbortError");
      expect(error.message).toBe("The operation was aborted");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("passes requests through when they complete in time", async () => {
    const originalFetch = globalThis.fetch;
    const response = { ok: true, status: 200 } as unknown as Response;
    globalThis.fetch = vi.fn().mockResolvedValue(response) as unknown as typeof fetch;
    try {
      const fetchWithTimeoutFn = fetchWithTimeout(1000);
      const result = await fetchWithTimeoutFn("https://example.com", { method: "GET" });
      expect(result).toBe(response);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "https://example.com",
        expect.objectContaining({ method: "GET" }),
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});