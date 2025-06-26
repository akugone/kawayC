"use client";

import { useAppKit } from "@reown/appkit/react";
import { Shield, User } from "lucide-react";
import React, { ReactNode, useState } from "react";
import { useAccount } from "wagmi";
import { useSIWE } from "../../hooks/useSIWE";
import { Button } from "../ui/button";
import { SIWEModal } from "./SIWEModal";

interface LoginGatedProps {
  children: ReactNode;
  requireSIWE?: boolean;
  fallbackContent?: ReactNode;
  onAuthComplete?: () => void;
}

export function LoginGated({
  children,
  requireSIWE = true,
  fallbackContent,
  onAuthComplete,
}: Readonly<LoginGatedProps>) {
  const { isConnected } = useAccount();
  const { isSignedIn } = useSIWE();
  const { open } = useAppKit();
  const [isSIWEModalOpen, setIsSIWEModalOpen] = useState(false);

  // Auto-open SIWE modal when SIWE is required but not signed in
  React.useEffect(() => {
    if (requireSIWE && isConnected && !isSignedIn) {
      setIsSIWEModalOpen(true);
    }
  }, [requireSIWE, isConnected, isSignedIn]);

  if (!isConnected) {
    // Show connect wallet page
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Connect Your Wallet
              </h1>
              <p className="text-gray-600 text-sm">
                Connect your wallet to access the confidential KYC platform
              </p>
            </div>
            <div className="space-y-4">
              <Button
                onClick={() => open({ view: "Connect" })}
                size="lg"
                className="w-full"
              >
                <User className="w-4 h-4 mr-2" />
                Connect Wallet
              </Button>
              <p className="text-xs text-gray-500 text-center">
                After connecting your wallet, you'll be prompted to sign in with
                Ethereum for secure KYC operations.
              </p>
            </div>
            <div className="mt-6 text-center text-xs text-gray-500">
              <p>Powered by iExec Confidential Computing</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If SIWE is required and not signed, show SIWE modal
  if (requireSIWE && !isSignedIn) {
    return (
      <>
        {children}
        <SIWEModal
          isOpen={isSIWEModalOpen}
          onClose={() => setIsSIWEModalOpen(false)}
          requireSIWE={true}
          onAuthComplete={() => {
            console.log("✅ SIWE authentication completed");
            setIsSIWEModalOpen(false);
            if (onAuthComplete) {
              onAuthComplete();
            }
          }}
        />
      </>
    );
  }

  // Otherwise, show children
  return <>{children}</>;
}
