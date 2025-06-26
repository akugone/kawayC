"use client";

import { Button } from "@/components/ui/button";
import { Home, Shield } from "lucide-react";
import { useRouter } from "next/navigation";

interface HomeNavProps {
  variant?: "header" | "floating" | "inline";
  className?: string;
  showLogo?: boolean;
}

export function HomeNav({
  variant = "header",
  className = "",
  showLogo = true,
}: HomeNavProps) {
  const router = useRouter();

  const handleGoHome = () => {
    router.push("/");
  };

  if (variant === "floating") {
    return (
      <Button
        onClick={handleGoHome}
        variant="outline"
        size="sm"
        className={`shadow-lg ${className}`}
        title="Go to Home"
      >
        <Home className="w-4 h-4 mr-2" />
        Home
      </Button>
    );
  }

  if (variant === "inline") {
    return (
      <Button
        onClick={handleGoHome}
        variant="ghost"
        size="sm"
        className={className}
        title="Go to Home"
      >
        <Home className="w-4 h-4 mr-2" />
        Home
      </Button>
    );
  }

  // Default header variant
  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {showLogo && (
        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
          <Shield className="w-5 h-5 text-white" />
        </div>
      )}
      <Button
        onClick={handleGoHome}
        variant="ghost"
        size="sm"
        className="font-medium"
      >
        <Home className="w-4 h-4 mr-2" />
        iExec KYC
      </Button>
    </div>
  );
}
