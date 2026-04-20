import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    let mounted = true;

    const handleCallback = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const errorParam = params.get("error");
        const errorDescription = params.get("error_description");

        if (errorParam) {
          if (mounted) {
            setError(errorDescription || errorParam);
            toast.error(errorDescription || "Authentication failed");
          }
          setTimeout(() => mounted && navigate("/login", { replace: true }), 2000);
          return;
        }

        // Wait a bit for Supabase to process the session
        await new Promise(resolve => setTimeout(resolve, 500));

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (!session) {
          throw new Error("No session created");
        }

        if (mounted) {
          await redirectAfterAuth(session.user.id);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        if (mounted) {
          setError(message);
          setProcessing(false);
          toast.error("Authentication failed. Please try again.");
          setTimeout(() => mounted && navigate("/login", { replace: true }), 2000);
        }
      }
    };

    handleCallback();

    return () => {
      mounted = false;
    };
  }, [location, navigate]);

  const redirectAfterAuth = async (userId: string) => {
    try {
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
    } catch (err) {
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
      ) : processing ? (
        <>
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Completing sign in...</p>
        </>
      ) : null}
    </div>
  );
}
