import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    // Check if it's a Firebase-related error
    if (
      error.message.includes("fetch") ||
      error.message.includes("Firebase") ||
      error.message.includes("Firestore")
    ) {
      console.log(
        "🔄 Firebase error detected - this is a known connectivity issue",
      );
    }

    this.setState({
      error,
      errorInfo,
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isFirebaseError =
        this.state.error?.message.includes("fetch") ||
        this.state.error?.message.includes("Firebase") ||
        this.state.error?.message.includes("Firestore");

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                {isFirebaseError ? "Connection Error" : "Application Error"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                {isFirebaseError
                  ? "There's a connectivity issue with Firebase services. The app will work in offline mode."
                  : "Something went wrong. Please try refreshing the page."}
              </p>

              {process.env.NODE_ENV === "development" && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-muted-foreground">
                    Error Details (Development)
                  </summary>
                  <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                    {this.state.error?.toString()}
                  </pre>
                </details>
              )}

              <div className="flex gap-2">
                <Button onClick={this.handleRetry} className="flex-1">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
                <Button
                  variant="outline"
                  onClick={() => (window.location.href = "/admin/years")}
                  className="flex-1"
                >
                  Go to Years
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
