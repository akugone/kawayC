"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

interface DebugContextType {
  isDebugEnabled: boolean;
  toggleDebug: () => void;
  setDebugEnabled: (enabled: boolean) => void;
  resetKycSession: () => void;
}

const DebugContext = createContext<DebugContextType | undefined>(undefined);

export function DebugProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [isDebugEnabled, setIsDebugEnabled] = useState(false);

  // Initialize debug state from localStorage on mount
  useEffect(() => {
    const savedDebugState = localStorage.getItem("debug-enabled");
    if (savedDebugState !== null) {
      setIsDebugEnabled(JSON.parse(savedDebugState));
    } else {
      // Default to development mode if no saved state
      setIsDebugEnabled(process.env.NODE_ENV === "development");
    }
  }, []);

  // Add keyboard shortcut (Ctrl+Shift+D) to toggle debug mode
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === "D") {
        event.preventDefault();
        toggleDebug();
      }
      // Add keyboard shortcut (Ctrl+Shift+R) to reset KYC session
      if (event.ctrlKey && event.shiftKey && event.key === "R") {
        event.preventDefault();
        resetKycSession();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const toggleDebug = () => {
    const newState = !isDebugEnabled;
    setIsDebugEnabled(newState);
    localStorage.setItem("debug-enabled", JSON.stringify(newState));
  };

  const setDebugEnabled = (enabled: boolean) => {
    setIsDebugEnabled(enabled);
    localStorage.setItem("debug-enabled", JSON.stringify(enabled));
  };

  const resetKycSession = () => {
    try {
      localStorage.removeItem("kyc-flow-state");
      console.log("🧹 KYC session cleared from localStorage");
      // Reload the page to ensure clean state
      window.location.reload();
    } catch (error) {
      console.warn("Failed to reset KYC session:", error);
    }
  };

  const contextValue = useMemo(
    () => ({ isDebugEnabled, toggleDebug, setDebugEnabled, resetKycSession }),
    [isDebugEnabled]
  );

  return (
    <DebugContext.Provider value={contextValue}>
      {children}
    </DebugContext.Provider>
  );
}

export function useDebug() {
  const context = useContext(DebugContext);
  if (context === undefined) {
    throw new Error("useDebug must be used within a DebugProvider");
  }
  return context;
}
