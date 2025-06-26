"use client";

import { Bug, Eye, EyeOff } from "lucide-react";
import { useDebug } from "../../context/DebugContext";
import { Button } from "./button";

interface DebugToggleProps {
  variant?: "default" | "compact" | "floating";
  className?: string;
}

export function DebugToggle({
  variant = "default",
  className = "",
}: DebugToggleProps) {
  const { isDebugEnabled, toggleDebug } = useDebug();

  if (variant === "compact") {
    return (
      <Button
        onClick={toggleDebug}
        variant="ghost"
        size="sm"
        className={`p-2 ${className}`}
        title={isDebugEnabled ? "Hide Debug Info" : "Show Debug Info"}
      >
        {isDebugEnabled ? (
          <EyeOff className="w-4 h-4" />
        ) : (
          <Eye className="w-4 h-4" />
        )}
      </Button>
    );
  }

  if (variant === "floating") {
    return (
      <Button
        onClick={toggleDebug}
        variant="outline"
        size="sm"
        className={`shadow-lg ${className}`}
        title={isDebugEnabled ? "Hide Debug Info" : "Show Debug Info"}
      >
        <Bug className="w-4 h-4 mr-2" />
        {isDebugEnabled ? "Hide Debug" : "Show Debug"}
      </Button>
    );
  }

  return (
    <Button
      onClick={toggleDebug}
      variant={isDebugEnabled ? "default" : "outline"}
      size="sm"
      className={className}
    >
      <Bug className="w-4 h-4 mr-2" />
      {isDebugEnabled ? "Debug: ON" : "Debug: OFF"}
    </Button>
  );
}
