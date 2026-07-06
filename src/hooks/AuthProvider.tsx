import { useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { AuthContext } from "@/hooks/auth-context";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(
    null,
  );

  const fetchProfile = async (userId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("onboarding_complete")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        if (import.meta.env.DEV) {
          console.error("Error fetching profile:", error);
        }
        setOnboardingComplete(false);
        return false;
      }

      const complete = data?.onboarding_complete ?? false;
      setOnboardingComplete(complete);
      return complete;
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error("fetchProfile exception:", err);
      }
      setOnboardingComplete(false);
      return false;
    }
  };

  useEffect(() => {
    let mounted = true;
    let initializing = true;

    const initAuth = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          if (import.meta.env.DEV) {
            console.error("[Auth] Session fetch error:", error);
          }
          setSession(null);
          setOnboardingComplete(null);
          setLoading(false);
          initializing = false;
          return;
        }

        if (session?.user) {
          const {
            data: { user },
            error: userError,
          } = await supabase.auth.getUser();

          if (userError || !user) {
            setSession(null);
            setOnboardingComplete(null);
          } else {
            setSession(session);
            await fetchProfile(user.id);
          }
        } else {
          setSession(null);
          setOnboardingComplete(null);
        }
        setLoading(false);
        initializing = false;
      } catch (err) {
        if (!mounted) return;
        if (import.meta.env.DEV) {
          console.error("[Auth] Session error:", err);
        }
        setSession(null);
        setOnboardingComplete(null);
        setLoading(false);
        initializing = false;
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted || initializing) return;
      setSession(session ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setOnboardingComplete(null);
        setLoading(false);
      }
    });

    initAuth();

    return () => {
      mounted = false;
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
    setSession(null);
    setOnboardingComplete(null);
    setLoading(false);
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
