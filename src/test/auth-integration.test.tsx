import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import { AuthProvider } from "@/hooks/AuthProvider";
import { useAuth } from "@/hooks/auth-context";
// The REAL Supabase client: this test exists to prove the app no longer
// deadlocks against @supabase/auth-js' internal lock.
import { supabase } from "@/integrations/supabase/client";

const EMAIL = "freelancer@example.com";
const PASSWORD = "password123";
const USER_ID = "3f0c1f5e-0000-4000-8000-000000000001";

const requests: { url: string; method: string }[] = [];

/** Minimal Response stand-in so no real network / Node globals are required. */
function fakeResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => null },
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as unknown as Response;
}

function sessionPayload() {
  return {
    access_token: "stub-access-token",
    token_type: "bearer",
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    refresh_token: "stub-refresh-token",
    user: {
      id: USER_ID,
      aud: "authenticated",
      role: "authenticated",
      email: EMAIL,
      email_confirmed_at: new Date().toISOString(),
      app_metadata: { provider: "email", providers: ["email"] },
      user_metadata: {},
      created_at: new Date().toISOString(),
    },
  };
}

function installFetchStub() {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url =
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      requests.push({ url, method: (init?.method ?? "GET").toUpperCase() });

      const { pathname, searchParams } = new URL(url);

      if (pathname.endsWith("/auth/v1/token")) {
        if (searchParams.get("grant_type")) {
          return fakeResponse(sessionPayload());
        }
        return fakeResponse({ error: "bad_request", error_description: "no grant type" }, 400);
      }

      if (pathname.endsWith("/auth/v1/logout")) {
        return fakeResponse({}, 204);
      }

      // PostgREST: `maybeSingle()` expects an array and unwraps it.
      if (pathname.includes("/rest/v1/profiles")) {
        return fakeResponse([{ onboarding_complete: true }]);
      }

      return fakeResponse({ message: `unstubbed request: ${url}` }, 404);
    }),
  );
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

async function signIn() {
  await act(async () => {
    const { error } = await supabase.auth.signInWithPassword({ email: EMAIL, password: PASSWORD });
    expect(error).toBeNull();
  });
}

function profileRequestCount() {
  return requests.filter((r) => r.url.includes("/rest/v1/profiles")).length;
}

beforeEach(() => {
  requests.length = 0;
  installFetchStub();
});

afterEach(async () => {
  await act(async () => {
    // Local scope: no network, just drop the persisted session.
    await supabase.auth.signOut({ scope: "local" });
  });
  vi.unstubAllGlobals();
});

describe("AuthProvider against the real Supabase client", () => {
  it("resolves the app after an email/password sign-in instead of hanging", async () => {
    renderProvider();

    await signIn();

    await waitFor(
      () => {
        expect(screen.getByTestId("onboarding")).toHaveTextContent("true");
      },
      { timeout: 4000 },
    );

    expect(screen.getByTestId("session")).toHaveTextContent(USER_ID);
    expect(screen.getByTestId("loading")).toHaveTextContent("false");
    expect(profileRequestCount()).toBe(1);
  });

  it("resolves the initial session that the client emits from inside its lock", async () => {
    // Sign in with no provider mounted, then mount fresh: this reproduces the
    // page-reload / OAuth-return path where onAuthStateChange emits
    // INITIAL_SESSION while holding the auth lock and awaits the subscriber.
    // The old implementation awaited a profiles query there and hung forever.
    await signIn();

    renderProvider();

    await waitFor(
      () => {
        expect(screen.getByTestId("onboarding")).toHaveTextContent("true");
      },
      { timeout: 4000 },
    );

    expect(screen.getByTestId("session")).toHaveTextContent(USER_ID);
    expect(screen.getByTestId("loading")).toHaveTextContent("false");
    expect(profileRequestCount()).toBeGreaterThanOrEqual(1);
  });

  it("ends up on the login screen (not a spinner) when there is no session", async () => {
    renderProvider();

    await waitFor(
      () => {
        expect(screen.getByTestId("loading")).toHaveTextContent("false");
      },
      { timeout: 4000 },
    );

    expect(screen.getByTestId("session")).toHaveTextContent("none");
    expect(profileRequestCount()).toBe(0);
  });
});