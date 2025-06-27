"use client";

import { useDebug } from "../context/DebugContext";

/**
 * Utility hook to check if debug mode is enabled
 * This provides a simple boolean check for conditional rendering
 */
export function useDebugMode() {
  const { isDebugEnabled } = useDebug();
  return isDebugEnabled;
}

/**
 * Utility hook that returns a function to conditionally render debug content
 * Usage: {showDebug(() => <DebugComponent />)}
 */
export function useDebugRender() {
  const { isDebugEnabled } = useDebug();

  const showDebug = (renderFn: () => React.ReactNode) => {
    return isDebugEnabled ? renderFn() : null;
  };

  return { showDebug, isDebugEnabled };
}
