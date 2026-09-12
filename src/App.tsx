import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { AuthProvider } from "@/hooks/AuthProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import NotFound from "@/pages/NotFound";
import IncomePage from "@/pages/IncomePage";
import ExpensesPage from "@/pages/ExpensesPage";
import ClientsPage from "@/pages/ClientsPage";
import SettingsPage from "@/pages/SettingsPage";
import AuthCallback from "@/pages/AuthCallback";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfService from "@/pages/TermsOfService";
import RefundPolicy from "@/pages/RefundPolicy";
import Dashboard from "@/pages/Dashboard";
import Onboarding from "@/pages/Onboarding";
import ProjectsPage from "@/pages/ProjectsPage";
import TaxPage from "@/pages/TaxPage";
import InvoicesPage from "@/pages/InvoicesPage";
import { lazy, Suspense, useEffect } from "react";
import { PageLoader } from "@/components/PageLoader";

// Only the heavy landing page stays lazy — it's ~40KB and never needed by logged-in users
const LandingPage = lazy(() => import("@/pages/LandingPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes — prevents re-fetch spinners on every navigation
      staleTime: 5 * 60 * 1000,
      // Keep unused cache for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Don't re-fetch on every window focus
      refetchOnWindowFocus: false,
      // Retry once on failure instead of 3 times
      retry: 1,
    },
  },
});

// Catches ?code= landing on any page (Supabase ignoring redirectTo) and
// forwards to the real callback handler, preserving the query string.
function OAuthCodeInterceptor() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.has("code") && location.pathname !== "/auth/callback") {
      navigate(`/auth/callback${location.search}`, { replace: true });
    }
  }, [location, navigate]);

  return null;
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          <AuthProvider>
            <OAuthCodeInterceptor />
            <Routes>
              <Route path="/" element={<Suspense fallback={<PageLoader />}><LandingPage /></Suspense>} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/refund" element={<RefundPolicy />} />

              <Route
                path="/onboarding"
                element={
                  <ProtectedRoute>
                    <Onboarding />
                  </ProtectedRoute>
                }
              />

              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/income" element={<IncomePage />} />
                <Route path="/expenses" element={<ExpensesPage />} />
                <Route path="/clients" element={<ClientsPage />} />
                <Route path="/projects" element={<ProjectsPage />} />
                <Route path="/tax" element={<TaxPage />} />
                <Route path="/invoices" element={<InvoicesPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
