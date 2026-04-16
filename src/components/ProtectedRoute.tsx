import { useAuth } from "@/hooks/useAuth";
import { Navigate, useLocation } from "react-router-dom";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading, onboardingComplete } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // If user is on onboarding page but has already completed it, redirect to dashboard
  if (location.pathname === "/onboarding" && onboardingComplete === true) {
    return <Navigate to="/dashboard" replace />;
  }

  if (location.pathname === "/onboarding") {
    return <>{children}</>;
  }

  if (onboardingComplete !== true) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
