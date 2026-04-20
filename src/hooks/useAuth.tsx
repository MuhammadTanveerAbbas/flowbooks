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
    const { data, error } = await supabase
      .from("profiles")
      .select("onboarding_complete")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      // Only log in development
      if (import.meta.env.DEV) {
        console.error("Error fetching profile:", error);
      }
      return false;
    }

    const complete = data?.onboarding_complete ?? false;
    setOnboardingComplete(complete);
    return complete;
  };

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('[Auth] State change:', _event, session?.user?.email);
      setSession(session ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setOnboardingComplete(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      console.log('[Auth] Initial session:', session?.user?.email, error);
      if (error) {
        console.error('[Auth] Session fetch error:', error);
      }
      setSession(session ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setOnboardingComplete(null);
      }
      setLoading(false);
    }).catch((err) => {
      console.error('[Auth] Session error:', err);
      setSession(null);
      setOnboardingComplete(null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const refreshProfile = async () => {
    if (session?.user) {
      return await fetchProfile(session.user.id);
    }
    return false;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
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
