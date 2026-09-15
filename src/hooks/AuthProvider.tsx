import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { AuthContext } from "@/hooks/auth-context";

/** Hard cap on the profile round-trip so a stalled request can't block the UI. */
const PROFILE_TIMEOUT_MS = 15_000;
/** Cap on reading the initial session from the auth client during boot. */
const BOOTSTRAP_TIMEOUT_MS = 15_000;
/**
 * Last-resort watchdog. If the Supabase auth client never settles (offline
 * network, hung token refresh, blocked request) we still stop spinning.
 */
const AUTH_WATCHDOG_MS = 20_000;

/**
 * Resolves to `null` when the promise takes longer than `ms`, instead of
 * hanging forever the way a bare awaited Supabase call can.
 */
function withTimeout<T>(promise: PromiseLike<T>, ms: number): Promise<T | null> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);

  const mountedRef = useRef(true);
  // User whose profile has already been resolved. Keeping this makes token
  // refreshes (SIGNED_IN / TOKEN_REFRESHED) cheap instead of re-showing the
  // full-page loader on every auth event.
  const resolvedUserRef = useRef<string | null>(null);
  // Monotonic id so a slow, stale profile request can never overwrite newer state.
  const requestIdRef = useRef(0);
  // Once loading has settled once we no longer need the watchdog.
  const loadingSettledRef = useRef(false);

  const markSettled = useCallback(() => {
    loadingSettledRef.current = true;
    if (mountedRef.current) setLoading(false);
  }, []);

  const fetchProfile = useCallback(async (userId: string): Promise<boolean> => {
    try {
      const result = await withTimeout(
        supabase
          .from("profiles")
          .select("onboarding_complete")
          .eq("id", userId)
          .maybeSingle(),
        PROFILE_TIMEOUT_MS,
      );

      if (!result) {
        if (import.meta.env.DEV) console.error("[Auth] Profile fetch timed out");
        return false;
      }

      const { data, error } = result;
      if (error) {
        if (import.meta.env.DEV) console.error("[Auth] Error fetching profile:", error);
        return false;
      }

      return data?.onboarding_complete ?? false;
    } catch (err) {
      if (import.meta.env.DEV) console.error("[Auth] fetchProfile exception:", err);
      return false;
    }
  }, []);

  /**
   * Applies a session event to React state. Always invoked from a macrotask
   * (setTimeout) rather than from the `onAuthStateChange` callback itself — see
   * the comment inside the effect below for why that matters.
   */
  const applySession = useCallback(
    async (nextSession: Session | null) => {
      if (!mountedRef.current) return;

      const userId = nextSession?.user?.id ?? null;

      if (!userId) {
        resolvedUserRef.current = null;
        requestIdRef.current += 1;
        setSession(null);
        setOnboardingComplete(null);
        markSettled();
        return;
      }

      setSession(nextSession);

      // Already resolved for this user (token refresh / focus event): keep the
      // known onboarding state and skip the extra round-trip.
      if (resolvedUserRef.current === userId) {
        markSettled();
        return;
      }

      setLoading(true);
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;

      const complete = await fetchProfile(userId);

      if (!mountedRef.current || requestId !== requestIdRef.current) return;

      resolvedUserRef.current = userId;
      setOnboardingComplete(complete);
      markSettled();
    },
    [fetchProfile, markSettled],
  );

  useEffect(() => {
    mountedRef.current = true;
    loadingSettledRef.current = false;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      // ============================ IMPORTANT ============================
      // This callback must stay synchronous. Supabase awaits every subscriber
      // while it holds its internal storage lock — and, for the OAuth callback
      // (code exchange), INITIAL_SESSION and token-refresh paths, it notifies
      // subscribers from inside the still-unresolved `initializePromise`.
      //
      // Awaiting any other Supabase call here (e.g. `supabase.from(...)`, which
      // needs `auth.getSession()` to get the access token) therefore deadlocks
      // the auth client: `getSession()` waits on the very lock /
      // initializePromise that is waiting for this callback to finish. The app
      // then spins forever on every protected page and on /auth/callback.
      //
      // Deferring to a macrotask lets the auth client release its lock first.
      // (Same guidance as the supabase-js docs: use
      // `setTimeout(async () => { ... }, 0)` inside onAuthStateChange.)
      // ===================================================================
      setTimeout(() => {
        void applySession(newSession);
      }, 0);
    });

    // Authoritative initial load. `getSession()` resolves once the client has
    // finished exchanging the OAuth `code` from the URL (detectSessionInUrl) or
    // restoring/refreshing the stored session. The profile lookup runs from
    // here, safely outside of any auth callback.
    void (async () => {
      try {
        const result = await withTimeout(supabase.auth.getSession(), BOOTSTRAP_TIMEOUT_MS);

        if (!mountedRef.current) return;

        if (!result) {
          // The auth client is taking too long: the watchdog below unblocks the
          // UI and the deferred auth events still apply the session later.
          if (import.meta.env.DEV) console.error("[Auth] Initial session lookup timed out");
          return;
        }

        if (result.error && import.meta.env.DEV) {
          console.error("[Auth] Initial session error:", result.error);
        }

        await applySession(result.data.session ?? null);
      } catch (err) {
        if (import.meta.env.DEV) console.error("[Auth] Initial session exception:", err);
        if (mountedRef.current) {
          resolvedUserRef.current = null;
          setSession(null);
          setOnboardingComplete(null);
          markSettled();
        }
      }
    })();

    // Safety net: never leave the user staring at a spinner forever.
    const watchdog = setTimeout(() => {
      if (mountedRef.current && !loadingSettledRef.current) {
        if (import.meta.env.DEV) console.error("[Auth] Auth watchdog fired — unblocking UI");
        markSettled();
      }
    }, AUTH_WATCHDOG_MS);

    return () => {
      mountedRef.current = false;
      clearTimeout(watchdog);
      subscription.unsubscribe();
    };
  }, [applySession, markSettled]);

  const refreshProfile = useCallback(async () => {
    const userId = session?.user?.id;
    if (!userId) return false;

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    const complete = await fetchProfile(userId);

    if (!mountedRef.current || requestId !== requestIdRef.current) return complete;

    resolvedUserRef.current = userId;
    setOnboardingComplete(complete);
    return complete;
  }, [session, fetchProfile]);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error && import.meta.env.DEV) {
      console.error("[Auth] Sign out error:", error);
    }

    // Clear local state immediately instead of waiting for the SIGNED_OUT
    // event, so the UI can never be left half signed-in.
    if (mountedRef.current) {
      resolvedUserRef.current = null;
      requestIdRef.current += 1;
      setSession(null);
      setOnboardingComplete(null);
      markSettled();
    }
  }, [markSettled]);

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        onboardingComplete,
        refreshProfile,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
