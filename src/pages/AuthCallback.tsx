import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // Exchange the code for a session (PKCE flow)
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        // Session not ready yet — wait for the auth state change
        return;
      }
      await redirectAfterAuth(session.user.id);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        await redirectAfterAuth(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const redirectAfterAuth = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("onboarding_complete")
      .eq("id", userId)
      .maybeSingle();

    if (data?.onboarding_complete) {
      navigate("/dashboard", { replace: true });
    } else {
      navigate("/onboarding", { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
