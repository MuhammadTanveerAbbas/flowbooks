import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
// The real Supabase client + a stubbed network: this exercises the actual app
// shell, routing, auth guard, react-query hooks and every page component.
import App from "@/App";
import { supabase } from "@/integrations/supabase/client";

const EMAIL = "freelancer@example.com";
const PASSWORD = "password123";
const USER_ID = "3f0c1f5e-0000-4000-8000-0000000000ff";

const PROFILE_ROW = {
  id: USER_ID,
  full_name: "Jane Doe",
  country: "US",
  tax_status: "self_employed",
  monthly_income_goal: 5000,
  tax_saving_percent: 25,
  currency: "USD",
  onboarding_complete: true,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

const restRequests: string[] = [];

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
      user_metadata: { full_name: "Jane Doe" },
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
      const { pathname } = new URL(url);
      const method = (init?.method ?? "GET").toUpperCase();

      if (pathname.endsWith("/auth/v1/token")) return fakeResponse(sessionPayload());
      if (pathname.endsWith("/auth/v1/logout")) return fakeResponse({}, 204);
      if (pathname.endsWith("/auth/v1/user")) return fakeResponse(sessionPayload().user);

      if (pathname.includes("/rest/v1/")) {
        restRequests.push(pathname);
        // PostgREST always answers with an array; `maybeSingle()` unwraps it.
        if (pathname.includes("/rest/v1/profiles")) {
          return fakeResponse(method === "GET" ? [PROFILE_ROW] : [PROFILE_ROW]);
        }
        return fakeResponse([]);
      }

      return fakeResponse({ message: `unstubbed request: ${url}` }, 404);
    }),
  );
}

function goto(path: string) {
  window.history.pushState({}, "", path);
  return render(<App />);
}

async function expectHeading(name: string | RegExp) {
  const heading = await screen.findByRole("heading", { name }, { timeout: 6000 });
  expect(heading).toBeInTheDocument();
  // The error boundary must never take over a working page.
  expect(screen.queryByText(/Something went wrong/i)).not.toBeInTheDocument();
}

beforeEach(async () => {
  restRequests.length = 0;
  installFetchStub();
  await act(async () => {
    const { error } = await supabase.auth.signInWithPassword({ email: EMAIL, password: PASSWORD });
    if (error) throw error;
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("authenticated routes", () => {
  const protectedRoutes: [string, string | RegExp][] = [
    ["/dashboard", "Income vs Expenses"],
    ["/income", "Income"],
    ["/expenses", "Expenses"],
    ["/clients", "Clients"],
    ["/projects", "Projects"],
    ["/tax", "Tax Estimates"],
    ["/invoices", "Invoices"],
    ["/settings", "Settings"],
  ];

  it.each(protectedRoutes)("renders %s inside the app shell", async (path, heading) => {
    const view = goto(path);
    await expectHeading(heading);
    view.unmount();
  });

  it("renders the onboarding wizard", async () => {
    const view = goto("/onboarding");
    // onboarding_complete is true, so the guard bounces this to the dashboard.
    await expectHeading("Income vs Expenses");
    view.unmount();
  });

  it("completes the OAuth callback URL and lands on the dashboard", async () => {
    window.history.pushState({}, "", "/auth/callback?code=e2f3005a-325c-43c7-92f1-9029bbe00e63");
    const view = render(<App />);
    await expectHeading("Income vs Expenses");
    expect(window.location.pathname).toBe("/dashboard");
    view.unmount();
  });
});

describe("public routes", () => {
  const publicRoutes: [string, string | RegExp][] = [
    ["/login", "Welcome back"],
    ["/signup", "Create your account"],
    ["/privacy", "Privacy Policy"],
    ["/terms", "Terms of Service"],
    ["/refund", "Refund Policy"],
    ["/this-route-does-not-exist", "404"],
    ["/", /Freelance finances/i],
  ];

  it.each(publicRoutes)("renders %s", async (path, heading) => {
    const view = goto(path);
    await expectHeading(heading);
    view.unmount();
  });

  it("redirects a signed-out visitor from a protected route to login", async () => {
    await act(async () => {
      await supabase.auth.signOut({ scope: "local" });
    });

    const view = goto("/dashboard");
    await expectHeading("Welcome back");
    expect(window.location.pathname).toBe("/login");
    view.unmount();
  });
});