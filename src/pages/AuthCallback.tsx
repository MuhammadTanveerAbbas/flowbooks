import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(location.search);
      const code = params.get("code");

      if (!code) {
        // No code — just check if there's already a session
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) {
          await redirectAfterAuth(session.user.id);
        } else {
          toast.error("Authentication failed. Please try again.");
          navigate("/login", { replace: true });
        }
        return;
      }

      // Exchange the PKCE code for a session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error || !data.session) {
        toast.error("Authentication failed. Please try again.");
        navigate("/login", { replace: true });
        return;
      }

      await redirectAfterAuth(data.session.user.id);
    };

    handleCallback();
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
