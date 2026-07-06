import { useCallback, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(true);

  const redirectAfterAuth = useCallback(
    async (userId: string) => {
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
      } catch {
        navigate("/onboarding", { replace: true });
      }
    },
    [navigate],
  );

  useEffect(() => {
    let mounted = true;

    const handleCallback = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const errorParam = params.get("error");
        const errorDescription = params.get("error_description");
        const code = params.get("code");

        if (errorParam) {
          if (mounted) {
            setError(errorDescription || errorParam);
            toast.error(errorDescription || "Authentication failed");
          }
          setTimeout(() => mounted && navigate("/login", { replace: true }), 2000);
          return;
        }

        if (code) {
          const { data: existingSession } = await supabase.auth.getSession();
          if (!existingSession.session) {
            const { error: exchangeError } =
              await supabase.auth.exchangeCodeForSession(code);
            if (exchangeError) {
              const { data: retrySession } = await supabase.auth.getSession();
              if (!retrySession.session) {
                throw exchangeError;
              }
            }
          }
        } else {
          let sessionEstablished = false;
          for (let attempt = 0; attempt < 20; attempt += 1) {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
              sessionEstablished = true;
              break;
            }
            await new Promise((resolve) => setTimeout(resolve, 250));
          }

          if (!sessionEstablished) {
            if (mounted) {
              navigate("/login", { replace: true });
            }
            return;
          }
        }

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          throw new Error("No user created");
        }

        if (mounted) {
          await redirectAfterAuth(user.id);
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
  }, [location, navigate, redirectAfterAuth]);

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
