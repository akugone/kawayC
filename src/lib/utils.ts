import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// KYC Session Management Utilities
export const KYC_SESSION_KEY = "kyc-flow-state";

export const kycSessionUtils = {
  // Clear the KYC session from localStorage
  clearSession: () => {
    try {
      localStorage.removeItem(KYC_SESSION_KEY);
      console.log("🧹 KYC session cleared");
      return true;
    } catch (error) {
      console.warn("Failed to clear KYC session:", error);
      return false;
    }
  },

  // Check if there's an active KYC session
  hasActiveSession: () => {
    try {
      const session = localStorage.getItem(KYC_SESSION_KEY);
      if (!session) return false;

      const parsed = JSON.parse(session);
      return !!(
        parsed.processing ||
        parsed.protectedDataAddress ||
        parsed.results
      );
    } catch (error) {
      console.warn("Failed to check KYC session:", error);
      return false;
    }
  },

  // Get session info for debugging
  getSessionInfo: () => {
    try {
      const session = localStorage.getItem(KYC_SESSION_KEY);
      if (!session) return null;

      const parsed = JSON.parse(session);
      return {
        hasProcessing: !!parsed.processing,
        hasProtectedData: !!parsed.protectedDataAddress,
        hasResults: !!parsed.results,
        hasError: !!parsed.error,
        protectedDataAddress: parsed.protectedDataAddress,
        statusMessage: parsed.statusMessage,
      };
    } catch (error) {
      console.warn("Failed to get KYC session info:", error);
      return null;
    }
  },

  // Reset everything and reload the page
  resetAndReload: () => {
    kycSessionUtils.clearSession();
    window.location.reload();
  },
};
