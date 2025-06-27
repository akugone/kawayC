"use client";

import { AlertCircle, Home, RefreshCw } from "lucide-react";
import React, { Component, ReactNode } from "react";
import { useDebug } from "../../context/DebugContext";
import { Button } from "../ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("KYC App Error:", error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // In production, you might want to log this to an error reporting service
    if (process.env.NODE_ENV === "production") {
      // Example: Sentry.captureException(error, { contexts: { react: errorInfo } });
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full mx-4">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />

              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Something went wrong
              </h1>

              <p className="text-gray-600 mb-6">
                An unexpected error occurred in the KYC application. This might
                be due to a network issue or a temporary problem.
              </p>

              <div className="space-y-3">
                <Button onClick={this.handleRetry} className="w-full">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>

                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="w-full"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go to Home
                </Button>
              </div>

              <ErrorDetails
                error={this.state.error}
                errorInfo={this.state.errorInfo}
              />
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Separate component to use hooks
function ErrorDetails({
  error,
  errorInfo,
}: Readonly<{
  error?: Error;
  errorInfo?: React.ErrorInfo;
}>) {
  const { isDebugEnabled } = useDebug();

  if (!isDebugEnabled || !error) {
    return null;
  }

  return (
    <details className="mt-6 text-left">
      <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
        Show Error Details (Development)
      </summary>
      <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono">
        <div className="text-red-600 font-semibold">
          {error.name}: {error.message}
        </div>
        <div className="mt-2 text-gray-700">{error.stack}</div>
        {errorInfo && (
          <div className="mt-2 text-gray-600">
            Component Stack: {errorInfo.componentStack}
          </div>
        )}
      </div>
    </details>
  );
}

// Error Toast Component
export function useErrorToast() {
  const showError = (error: string | Error) => {
    const message = typeof error === "string" ? error : error.message;

    // Simple toast implementation (you could use a library like react-hot-toast)
    const toast = document.createElement("div");
    toast.className =
      "fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-all duration-300";
    toast.innerHTML = `
      <div class="flex items-center space-x-2">
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
        </svg>
        <span>${message}</span>
      </div>
    `;

    document.body.appendChild(toast);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(100%)";
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 5000);

    // Click to dismiss
    toast.addEventListener("click", () => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(100%)";
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 300);
    });
  };

  return { showError };
}

// Network Error Handler
export class NetworkErrorHandler {
  static handleError(error: any): string {
    if (!navigator.onLine) {
      return "You appear to be offline. Please check your internet connection.";
    }

    if (error.code === "NETWORK_ERROR") {
      return "Network error. Please check your connection and try again.";
    }

    if (error.code === "TIMEOUT_ERROR") {
      return "Request timed out. The iExec network might be busy, please try again.";
    }

    if (error.message?.includes("User rejected")) {
      return "Transaction was rejected. Please approve the transaction to continue.";
    }

    if (error.message?.includes("insufficient funds")) {
      return "Insufficient funds for transaction. Please ensure you have enough RLC tokens.";
    }

    if (error.message?.includes("DataProtector")) {
      return "Error with document encryption. Please try uploading your documents again.";
    }

    return error.message ?? "An unexpected error occurred. Please try again.";
  }
}

// Loading Component
export function LoadingSpinner({
  message = "Loading...",
  size = "default",
}: Readonly<{
  message?: string;
  size?: "small" | "default" | "large";
}>) {
  const sizeClasses = {
    small: "w-5 h-5",
    default: "w-8 h-8",
    large: "w-12 h-12",
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div
        className={`animate-spin rounded-full border-b-2 border-blue-500 ${sizeClasses[size]}`}
      />
      <p className="text-gray-600 text-sm">{message}</p>
    </div>
  );
}

// Retry Wrapper Component
export function RetryWrapper({
  children,
  onRetry,
  error,
  loading,
}: Readonly<{
  children: React.ReactNode;
  onRetry: () => void;
  error?: string;
  loading?: boolean;
}>) {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-700 mb-4">{error}</p>
        <Button onClick={onRetry}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
