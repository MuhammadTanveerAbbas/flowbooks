import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const code = params.get("code");
        const errorParam = params.get("error");
        const errorDescription = params.get("error_description");

        if (errorParam) {
          setError(errorDescription || errorParam);
          toast.error(errorDescription || "Authentication failed");
          setTimeout(() => navigate("/login", { replace: true }), 2000);
          return;
        }

        if (!code) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            await redirectAfterAuth(session.user.id);
          } else {
            setError("No authentication code received");
            toast.error("Authentication failed. Please try again.");
            setTimeout(() => navigate("/login", { replace: true }), 2000);
          }
          return;
        }

        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          setError(error.message);
          toast.error(error.message || "Authentication failed");
          setTimeout(() => navigate("/login", { replace: true }), 2000);
          return;
        }

        if (!data.session) {
          setError("No session created");
          toast.error("Authentication failed. Please try again.");
          setTimeout(() => navigate("/login", { replace: true }), 2000);
          return;
        }

        await redirectAfterAuth(data.session.user.id);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        toast.error("Authentication failed. Please try again.");
        setTimeout(() => navigate("/login", { replace: true }), 2000);
      }
    };

    handleCallback();
  }, [location, navigate]);

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
      {error ? (
        <div className="text-center space-y-2">
          <p className="text-destructive font-medium">Authentication Error</p>
          <p className="text-sm text-muted-foreground">{error}</p>
          <p className="text-xs text-muted-foreground">Redirecting to login...</p>
        </div>
      ) : (
        <>
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Completing sign in...</p>
        </>
      )}
    </div>
  );
}
