/**
 * Small server-side reliability helpers shared by the Vercel API functions.
 *
 * Intentional by design:
 * - no external dependencies (native language/runtime features only)
 * - pure, easily unit-tested functions
 * - bounded retries that fail gracefully instead of hammering providers
 */

export const RELIABILITY_DEFAULTS = {
  /** Per-attempt request timeout. */
  timeoutMs: 5000,
  /** Number of retries after the initial attempt. */
  maxRetries: 2,
  /** Base backoff before the first retry. */
  baseDelayMs: 150,
  /** Upper bound for backoff regardless of retry count. */
  maxDelayMs: 800,
} as const;

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Bounded jitter: returns a value between 0.5x and 1.5x of `delayMs`.
 * Keeps retries from synchronizing while staying within a small window.
 */
export function jitter(delayMs: number): number {
  const min = Math.floor(delayMs * 0.5);
  const max = Math.floor(delayMs * 1.5);
  return min + Math.floor(Math.random() * (max - min + 1));
}

/**
 * Exponential backoff with jitter, capped at `maxDelayMs` so retries never
 * sleep indefinitely.
 */
export function backoffDelay(
  attempt: number,
  baseDelayMs: number = RELIABILITY_DEFAULTS.baseDelayMs,
  maxDelayMs: number = RELIABILITY_DEFAULTS.maxDelayMs,
): number {
  const exponential = baseDelayMs * 2 ** attempt;
  return jitter(Math.min(exponential, maxDelayMs));
}

/**
 * Whether a failure is worth retrying. Permanent errors (auth, validation,
 * bad requests) are returned as-is so serious problems are not hidden.
 */
export function isTransientError(error: unknown): boolean {
  if (error === null || typeof error !== "object") return false;

  const status = (error as { status?: unknown }).status;
  if (typeof status === "number") {
    if (status === 429 || status >= 500) return true;
    if (status === 0) return isNetworkFailure(error);
  }

  const name = (error as { name?: unknown }).name;
  if (name === "AbortError" || error instanceof TypeError) return true;

  const code = (error as { code?: unknown }).code;
  return typeof code === "string" && code.startsWith("PGRST30");
}

function isNetworkFailure(error: unknown): boolean {
  const message = (error as { message?: unknown }).message;
  return (
    typeof message === "string" &&
    /^(AbortError|TypeError|FetchError)/i.test(message)
  );
}

/**
 * Runs `fn` with bounded retries. Only transient failures are retried;
 * the call stops after `maxRetries` and rethrows the last error so callers
 * can fail gracefully. No retry loops, no infinite waits.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelayMs?: number;
    maxDelayMs?: number;
    isTransient?: (error: unknown) => boolean;
  } = {},
): Promise<T> {
  const maxRetries = options.maxRetries ?? RELIABILITY_DEFAULTS.maxRetries;
  const baseDelayMs = options.baseDelayMs ?? RELIABILITY_DEFAULTS.baseDelayMs;
  const maxDelayMs = options.maxDelayMs ?? RELIABILITY_DEFAULTS.maxDelayMs;
  const isTransient = options.isTransient ?? isTransientError;

  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt >= maxRetries || !isTransient(error)) throw error;
      await sleep(backoffDelay(attempt, baseDelayMs, maxDelayMs));
    }
  }
  throw lastError;
}

/**
 * Wraps the global fetch with a hard timeout so a hanging provider never
 * stalls a serverless function indefinitely.
 */
export function fetchWithTimeout(timeoutMs: number): typeof fetch {
  return (
    input: Parameters<typeof fetch>[0],
    init?: Parameters<typeof fetch>[1],
  ) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    init?.signal?.addEventListener?.("abort", () => controller.abort(), {
      once: true,
    });
    return fetch(input, { ...init, signal: controller.signal }).finally(() =>
      clearTimeout(timer),
    );
  };
}