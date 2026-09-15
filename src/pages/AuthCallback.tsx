import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/** How long to wait for the auth client to surface the session after a redirect. */
const SESSION_WAIT_ATTEMPTS = 20;
const SESSION_WAIT_INTERVAL_MS = 250;
/** Cap on the post-login profile lookup so the redirect is never blocked. */
const PROFILE_TIMEOUT_MS = 10_000;

/** Resolves to `null` on timeout instead of hanging forever. */
function withTimeout<T>(promise: PromiseLike<T>, ms: number): Promise<T | null> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}

/**
 * Waits for the session produced by the redirect. `getSession()` resolves only
 * after the Supabase client has finished initialising — including the PKCE code
 * exchange it performs itself because `detectSessionInUrl` is enabled.
 */
async function waitForSession(): Promise<Session | null> {
  for (let attempt = 0; attempt < SESSION_WAIT_ATTEMPTS; attempt += 1) {
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) return data.session;
    await new Promise((resolve) => setTimeout(resolve, SESSION_WAIT_INTERVAL_MS));
  }
  return null;
}

/** Decides whether to land on the dashboard or the onboarding wizard. */
async function resolveDestination(userId: string): Promise<string> {
  try {
    const result = await withTimeout(
      supabase
        .from("profiles")
        .select("onboarding_complete")
        .eq("id", userId)
        .maybeSingle(),
      PROFILE_TIMEOUT_MS,
    );
    return result?.data?.onboarding_complete ? "/dashboard" : "/onboarding";
  } catch {
    return "/onboarding";
  }
}

export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(true);
  // Guards against a double effect run redeeming the same code twice.
  const startedRef = useRef(false);

  const goToLogin = useCallback(() => navigate("/login", { replace: true }), [navigate]);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    let mounted = true;

    const fail = (message: string) => {
      if (!mounted) return;
      setError(message);
      setProcessing(false);
      toast.error("Authentication failed. Please try again.");
      setTimeout(() => {
        if (mounted) goToLogin();
      }, 3000);
    };

    const run = async () => {
      const params = new URLSearchParams(location.search);

      // Supabase reports provider/PKCE failures through the query string.
      const urlError =
        params.get("error_description") || params.get("error_code") || params.get("error");
      if (urlError) {
        fail(urlError);
        return;
      }

      const code = params.get("code");

      // The client runs with `detectSessionInUrl: true`, so it redeems the PKCE
      // code itself while initialising (and removes `code` from the URL).
      // `getSession()` only resolves after that initialisation finished.
      //
      // Do NOT call `exchangeCodeForSession()` unconditionally here: racing the
      // client's own exchange consumed the one-time code verifier, which left
      // this page spinning on "Completing sign in..." forever.
      let session = await waitForSession();

      if (!session && code) {
        // Fallback for redirects that the client could not auto-detect (e.g. the
        // link was opened in a tab where the client was already initialised).
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          fail(exchangeError.message);
          return;
        }
        session = data.session;
      }

      if (!session?.user) {
        fail("We couldn't complete your sign in. The link may have expired — please try again.");
        return;
      }

      const destination = await resolveDestination(session.user.id);
      if (mounted) navigate(destination, { replace: true });
    };

    void run().catch((err) => fail(err instanceof Error ? err.message : "Unknown error"));

    return () => {
      mounted = false;
    };
  }, [location.search, navigate, goToLogin]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4 px-4">
      {error ? (
        <div className="text-center space-y-3">
          <p className="text-destructive font-medium">Authentication Error</p>
          <p className="text-sm text-muted-foreground max-w-sm">{error}</p>
          <p className="text-xs text-muted-foreground">Redirecting to login...</p>
          <Button variant="outline" size="sm" onClick={goToLogin}>
            Back to login
          </Button>
        </div>
      ) : processing ? (
        <>
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Completing sign in...</p>
        </>
      ) : null}
    </div>
  );
}
