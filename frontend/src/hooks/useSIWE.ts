"use client";

import { hmac } from "@noble/hashes/hmac";
import { keccak_256 } from "@noble/hashes/sha3";
import { getBytes, keccak256, SigningKey, Wallet } from "ethers";
import { useCallback, useEffect, useState } from "react";
import { useAccount, useSignMessage } from "wagmi";

interface SIWEState {
  isSignedIn: boolean;
  isSigning: boolean;
  error?: string;
  derivedWallet?: Wallet;
  sessionExpiry?: number;
}

const SIWE_STORAGE_KEY = "siwe-session";
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Custom event for SIWE state changes
const SIWE_EVENT = "siwe-state-changed";

// Helper function to load SIWE state from localStorage
const loadSIWEState = (address: string): SIWEState => {
  try {
    const stored = localStorage.getItem(SIWE_STORAGE_KEY);
    if (stored) {
      const session = JSON.parse(stored);

      // Check if session is for current address and not expired
      if (
        session.address === address &&
        session.expiry > Date.now() &&
        session.derivedKey
      ) {
        // Recreate derived wallet from stored key
        const signingKey = new SigningKey(session.derivedKey);
        const derivedWallet = new Wallet(signingKey);

        return {
          isSignedIn: true,
          isSigning: false,
          derivedWallet,
          sessionExpiry: session.expiry,
        };
      } else {
        // Clear expired/invalid session
        localStorage.removeItem(SIWE_STORAGE_KEY);
      }
    }
  } catch (error) {
    console.warn("Failed to load SIWE session:", error);
    localStorage.removeItem(SIWE_STORAGE_KEY);
  }

  return {
    isSignedIn: false,
    isSigning: false,
  };
};

export function useSIWE() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const [siweState, setSiweState] = useState<SIWEState>({
    isSignedIn: false,
    isSigning: false,
  });

  // Load existing session on mount and listen for changes
  useEffect(() => {
    if (!isConnected || !address) {
      setSiweState((prev) => ({
        ...prev,
        isSignedIn: false,
        derivedWallet: undefined,
      }));
      return;
    }

    // Load initial state
    const initialState = loadSIWEState(address);
    setSiweState(initialState);

    // Listen for SIWE state changes from other components
    const handleSIWEChange = () => {
      const newState = loadSIWEState(address);
      setSiweState(newState);
    };

    window.addEventListener(SIWE_EVENT, handleSIWEChange);

    return () => {
      window.removeEventListener(SIWE_EVENT, handleSIWEChange);
    };
  }, [address, isConnected]);

  // Generate SIWE message
  const generateSIWEMessage = useCallback((address: string, nonce: string) => {
    const domain =
      typeof window !== "undefined" ? window.location.host : "localhost:3000";
    const uri =
      typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost:3000";
    const issuedAt = new Date().toISOString();

    return [
      `${domain} wants you to sign in with your Ethereum account:`,
      address,
      "",
      "🔐 Sign in to iExec Confidential KYC",
      "This signature creates a secure session without exposing your private key.",
      "",
      `URI: ${uri}`,
      "Version: 1",
      `Chain ID: 134`, // Bellecour
      `Nonce: ${nonce}`,
      `Issued At: ${issuedAt}`,
    ].join("\n");
  }, []);

  // Derive key from signature for deterministic wallet
  const deriveKey = useCallback(
    (signature: string, namespace: string = "iExec.KYC") => {
      const signatureHash = keccak_256(getBytes(signature));
      return hmac(
        keccak_256,
        signatureHash,
        new TextEncoder().encode(namespace)
      );
    },
    []
  );

  // Sign in with SIWE
  const signIn = useCallback(async () => {
    if (!address || !isConnected || siweState.isSigning) {
      return;
    }

    setSiweState((prev) => ({ ...prev, isSigning: true, error: undefined }));

    try {
      // Generate deterministic nonce from address and timestamp
      const timestamp = Date.now().toString();
      const nonceInput = `${address}${timestamp}`;
      const nonce = keccak256(
        getBytes(new TextEncoder().encode(nonceInput))
      ).slice(2, 18);
      const message = generateSIWEMessage(address, nonce);

      console.log("🔏 Signing SIWE message...");

      const signature = await signMessageAsync({ message });

      // Derive key for creating deterministic wallet
      const derivedKeyBytes = deriveKey(signature);
      const derivedKey =
        "0x" +
        Array.from(derivedKeyBytes)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");

      // Create derived wallet
      const signingKey = new SigningKey(derivedKey);
      const derivedWallet = new Wallet(signingKey);

      const expiry = Date.now() + SESSION_DURATION;

      // Store session
      const session = {
        address,
        derivedKey,
        expiry,
        signature, // For potential re-verification
        timestamp: Date.now(),
      };

      localStorage.setItem(SIWE_STORAGE_KEY, JSON.stringify(session));

      const newState = {
        isSignedIn: true,
        isSigning: false,
        derivedWallet,
        sessionExpiry: expiry,
      };

      setSiweState(newState);

      // Notify other components about the state change
      window.dispatchEvent(new CustomEvent(SIWE_EVENT));

      console.log("✅ SIWE sign-in successful");
      console.log("🔑 Derived wallet address:", derivedWallet.address);
    } catch (error: any) {
      console.error("❌ SIWE sign-in failed:", error);

      setSiweState((prev) => ({
        ...prev,
        isSigning: false,
        error:
          error.code === 4001 ? "User rejected signature" : "Sign-in failed",
      }));
    }
  }, [
    address,
    isConnected,
    siweState.isSigning,
    generateSIWEMessage,
    signMessageAsync,
    deriveKey,
  ]);

  // Sign out
  const signOut = useCallback(() => {
    localStorage.removeItem(SIWE_STORAGE_KEY);
    const newState = {
      isSignedIn: false,
      isSigning: false,
      derivedWallet: undefined,
    };
    setSiweState(newState);

    // Notify other components about the state change
    window.dispatchEvent(new CustomEvent(SIWE_EVENT));

    console.log("🚪 SIWE signed out");
  }, []);

  // Get derived wallet for iExec operations
  const getDerivedWallet = useCallback(
    (provider?: any) => {
      if (!siweState.derivedWallet) return null;

      // Connect to provider if provided (for iExec operations)
      return provider
        ? siweState.derivedWallet.connect(provider)
        : siweState.derivedWallet;
    },
    [siweState.derivedWallet]
  );

  // Auto sign-out on wallet disconnect
  useEffect(() => {
    if (!isConnected && siweState.isSignedIn) {
      signOut();
    }
  }, [isConnected, siweState.isSignedIn, signOut]);

  return {
    // State
    isSignedIn: siweState.isSignedIn,
    isSigning: siweState.isSigning,
    error: siweState.error,
    sessionExpiry: siweState.sessionExpiry,

    // Actions
    signIn,
    signOut,
    getDerivedWallet,

    // Utils
    canSignIn: isConnected && !!address && !siweState.isSigning,
    timeUntilExpiry: siweState.sessionExpiry
      ? Math.max(0, siweState.sessionExpiry - Date.now())
      : 0,
  };
}
