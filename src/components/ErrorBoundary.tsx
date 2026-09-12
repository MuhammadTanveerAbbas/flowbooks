import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  retried: boolean;
}

function isChunkLoadError(error: Error): boolean {
  return (
    error.message.includes("Failed to fetch dynamically imported module") ||
    error.message.includes("Importing a module script failed") ||
    error.name === "ChunkLoadError"
  );
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    retried: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    // For chunk load errors, don't show the error screen — just mark for retry
    if (isChunkLoadError(error)) {
      return { hasError: true, error, retried: false };
    }
    return { hasError: true, error, retried: false };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error("Uncaught error:", error, errorInfo);
    }

    // Auto-reload once for chunk load errors (stale Vite cache / network blip)
    if (isChunkLoadError(error) && !this.state.retried) {
      this.setState({ retried: true }, () => {
        window.location.reload();
      });
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, retried: false });
    window.location.href = "/dashboard";
  };

  public render() {
    if (this.state.hasError && !isChunkLoadError(this.state.error!)) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <h1 className="text-xl font-serif font-semibold mb-2">
                Something went wrong
              </h1>
              <p className="text-sm text-muted-foreground mb-6">
                We encountered an unexpected error. Please try refreshing the page.
              </p>
              {import.meta.env.DEV && this.state.error && (
                <div className="mb-4 p-3 bg-muted rounded text-left text-xs font-mono overflow-auto max-h-32">
                  {this.state.error.toString()}
                </div>
              )}
              <div className="flex gap-2 justify-center">
                <Button onClick={this.handleReset} variant="default">
                  Go to Dashboard
                </Button>
                <Button onClick={() => window.location.reload()} variant="outline">
                  Refresh Page
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    // For chunk load errors, show a brief loading indicator while auto-reloading
    if (this.state.hasError && isChunkLoadError(this.state.error!)) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center space-y-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">Reloading...</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
