"use client";

import {
  CheckCircle,
  FileSignature,
  Loader2,
  LogOut,
  Shield,
} from "lucide-react";
import { useAccount } from "wagmi";
import { useSIWE } from "../../hooks/useSIWE";
import { Button } from "../ui/button";

interface SIWEButtonProps {
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default" | "lg";
  showStatus?: boolean;
  onSignInSuccess?: () => void;
  className?: string;
}

export function SIWEButton({
  variant = "default",
  size = "default",
  showStatus = true,
  onSignInSuccess,
  className = "",
}: Readonly<SIWEButtonProps>) {
  const { isConnected } = useAccount();
  const {
    isSignedIn,
    isSigning,
    error,
    signIn,
    signOut,
    canSignIn,
    timeUntilExpiry,
  } = useSIWE();

  const handleSignIn = async () => {
    await signIn();
    if (onSignInSuccess) {
      onSignInSuccess();
    }
  };

  const formatTimeRemaining = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (!isConnected) {
    return (
      <div className="text-center">
        <p className="text-sm text-gray-600 mb-2">Connect your wallet first</p>
        <Button disabled variant="outline" size={size} className={className}>
          <Shield className="w-4 h-4 mr-2" />
          Sign In With Ethereum
        </Button>
      </div>
    );
  }

  if (isSignedIn) {
    return (
      <div className="space-y-2">
        {showStatus && (
          <div className="flex items-center space-x-2 text-sm text-green-700 bg-green-50 p-3 rounded-lg">
            <CheckCircle className="w-4 h-4" />
            <div>
              <p className="font-medium">Signed in with Ethereum</p>
              <p className="text-xs text-green-600">
                Session expires in {formatTimeRemaining(timeUntilExpiry)}
              </p>
            </div>
          </div>
        )}

        <Button
          onClick={signOut}
          variant="outline"
          size="sm"
          className={`text-gray-600 hover:text-gray-800 ${className}`}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Button
        onClick={handleSignIn}
        disabled={!canSignIn}
        variant={variant}
        size={size}
        className={className}
      >
        {isSigning ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Signing Message...
          </>
        ) : (
          <>
            <FileSignature className="w-4 h-4 mr-2" />
            Sign In With Ethereum
          </>
        )}
      </Button>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded border">
          ❌ {error}
        </div>
      )}

      {showStatus && !isSigning && (
        <div className="text-xs text-gray-600 space-y-1">
          <p>
            🔐 <strong>Why sign this message?</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-500">
            <li>Creates a secure session without exposing your private key</li>
            <li>
              Enables seamless iExec operations without multiple signatures
            </li>
            <li>Session expires automatically after 24 hours</li>
            <li>No transaction fees - just a signature</li>
          </ul>
        </div>
      )}
    </div>
  );
}
