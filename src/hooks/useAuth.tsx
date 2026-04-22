import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  onboardingComplete: boolean | null;
  refreshProfile: () => Promise<boolean>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  onboardingComplete: null,
  refreshProfile: async () => false,
  signOut: async () => {},
});

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
        // Treat fetch failure as onboarding not complete so user can set up profile
        setOnboardingComplete(false);
        return false;
      }

      // If no profile row yet (trigger may not have fired), treat as incomplete
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

        setSession(session ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
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
      if (import.meta.env.DEV) {
        console.log("[Auth] State change:", _event, session?.user?.email);
      }
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

export const useAuth = () => useContext(AuthContext);
