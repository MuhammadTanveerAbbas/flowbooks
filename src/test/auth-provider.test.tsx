import { describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import type { Session } from "@supabase/supabase-js";
import { AuthProvider } from "@/hooks/AuthProvider";
import { useAuth } from "@/hooks/auth-context";

/**
 * Fake Supabase client that reproduces the behaviour which used to deadlock the
 * app in production:
 *
 *  - `onAuthStateChange` awaits every subscriber while the client's internal
 *    lock is held (GoTrueClient#_notifyAllSubscribers).
 *  - `auth.getSession()` — and therefore any PostgREST request, which needs an
 *    access token — waits on that same lock (and on `initializePromise`).
 *
 * So if an auth-state callback awaits another Supabase call, no progress is
 * possible: the callback can never finish, the lock is never released and
 * `loading` stayed `true` forever (every dashboard page spun indefinitely).
 */
const mocks = vi.hoisted(() => {
  let lockHeld = false;
  let storedSession: unknown = null;
  let subscriber: ((event: string, session: unknown) => unknown) | undefined;

  const getSession = vi.fn(async () => {
    if (lockHeld) {
      // Never settles — mirrors waiting on the held lock / initializePromise.
      return new Promise<never>(() => {});
    }
    return { data: { session: storedSession }, error: null };
  });

  const maybeSingle = vi.fn(async () => {
    // PostgREST request: fetchWithAuth resolves the access token via getSession.
    await getSession();
    return { data: { onboarding_complete: true }, error: null };
  });

  const eq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));

  const auth = {
    getSession,
    signOut: vi.fn(async () => ({ error: null })),
    onAuthStateChange: (callback: (event: string, session: unknown) => unknown) => {
      subscriber = callback;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    },
  };

  /** Emits an auth event exactly like GoTrueClient: lock held, callback awaited. */
  const emit = async (event: string, session: unknown) => {
    storedSession = session;
    lockHeld = true;
    try {
      if (subscriber) await subscriber(event, session);
    } finally {
      lockHeld = false;
    }
  };

  return {
    supabase: { auth, from },
    emit,
    getSession,
    maybeSingle,
    setStoredSession: (session: unknown) => {
      storedSession = session;
    },
  };
});

vi.mock("@/integrations/supabase/client", () => ({
  supabase: mocks.supabase,
}));

function makeSession(id = "user-1"): Session {
  return {
    access_token: "access-token",
    refresh_token: "refresh-token",
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: "bearer",
    user: {
      id,
      aud: "authenticated",
      role: "authenticated",
      app_metadata: {},
      user_metadata: {},
      created_at: new Date().toISOString(),
    },
  } as unknown as Session;
}

function Probe() {
  const { loading, session, onboardingComplete } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="session">{session?.user.id ?? "none"}</span>
      <span data-testid="onboarding">{String(onboardingComplete)}</span>
    </div>
  );
}

function renderProvider() {
  return render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );
}

describe("AuthProvider", () => {
  it("never deadlocks when the auth client notifies subscribers while its lock is held", async () => {
    mocks.getSession.mockClear();
    mocks.maybeSingle.mockClear();
    mocks.setStoredSession(null);

    renderProvider();

    // The old implementation awaited the profile query inside this callback,
    // which meant this promise could never resolve.
    const session = makeSession("user-42");
    await act(async () => {
      await expect(mocks.emit("INITIAL_SESSION", session)).resolves.toBeUndefined();
    });

    // The profile lookup only resolves because the deferred event handler runs
    // after the auth client released its lock.
    await waitFor(() => {
      expect(screen.getByTestId("onboarding")).toHaveTextContent("true");
    });

    expect(screen.getByTestId("session")).toHaveTextContent("user-42");
    expect(screen.getByTestId("loading")).toHaveTextContent("false");
    expect(mocks.maybeSingle).toHaveBeenCalledTimes(1);
  });

  it("resolves the stored session on boot without waiting for an auth event", async () => {
    mocks.getSession.mockClear();
    mocks.maybeSingle.mockClear();
    mocks.setStoredSession(makeSession("user-7"));

    renderProvider();

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });

    expect(screen.getByTestId("session")).toHaveTextContent("user-7");
    expect(screen.getByTestId("onboarding")).toHaveTextContent("true");
  });

  it("does not re-fetch the profile for repeated events of the same user", async () => {
    mocks.getSession.mockClear();
    mocks.maybeSingle.mockClear();
    mocks.setStoredSession(makeSession("user-9"));

    renderProvider();

    await waitFor(() => {
      expect(screen.getByTestId("onboarding")).toHaveTextContent("true");
    });

    await act(async () => {
      await mocks.emit("TOKEN_REFRESHED", makeSession("user-9"));
      await mocks.emit("SIGNED_IN", makeSession("user-9"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });

    expect(mocks.maybeSingle).toHaveBeenCalledTimes(1);
  });

  it("clears the session when the user signs out", async () => {
    mocks.getSession.mockClear();
    mocks.maybeSingle.mockClear();
    mocks.setStoredSession(makeSession("user-3"));

    renderProvider();

    await waitFor(() => {
      expect(screen.getByTestId("session")).toHaveTextContent("user-3");
    });

    await act(async () => {
      await mocks.emit("SIGNED_OUT", null);
    });

    await waitFor(() => {
      expect(screen.getByTestId("session")).toHaveTextContent("none");
    });
    expect(screen.getByTestId("loading")).toHaveTextContent("false");
  });
});