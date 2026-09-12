import { useEffect, useState, useRef, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { AuthContext } from "@/hooks/auth-context";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);
  const mountedRef = useRef(true);
  // Prevent handling the same auth event twice (React StrictMode double-invoke)
  const initializedRef = useRef(false);

  const fetchProfile = async (userId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("onboarding_complete")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        if (import.meta.env.DEV) console.error("Error fetching profile:", error);
        if (mountedRef.current) setOnboardingComplete(false);
        return false;
      }

      const complete = data?.onboarding_complete ?? false;
      if (mountedRef.current) setOnboardingComplete(complete);
      return complete;
    } catch (err) {
      if (import.meta.env.DEV) console.error("fetchProfile exception:", err);
      if (mountedRef.current) setOnboardingComplete(false);
      return false;
    }
  };

  useEffect(() => {
    mountedRef.current = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mountedRef.current) return;

      if (newSession?.user) {
        // Use the session from the event directly — it is already validated
        // by the Supabase client. Do NOT call getUser() here; doing so
        // triggers a new network request that fires another auth state change,
        // creating an infinite loop that keeps loading = true forever.
        setSession(newSession);
        await fetchProfile(newSession.user.id);
      } else {
        setSession(null);
        setOnboardingComplete(null);
      }

      if (mountedRef.current) setLoading(false);
    });

    return () => {
      mountedRef.current = false;
      initializedRef.current = false;
      subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = async () => {
    if (session?.user) {
      return await fetchProfile(session.user.id);
    }
    return false;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error && import.meta.env.DEV) {
      console.error("[Auth] Sign out error:", error);
    }
    // onAuthStateChange fires SIGNED_OUT automatically, which clears state above
  };

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
