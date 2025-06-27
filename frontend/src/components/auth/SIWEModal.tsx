"use client";

import { useAppKit } from "@reown/appkit/react";
import { Shield, User, Wallet, X } from "lucide-react";
import React from "react";
import { useAccount } from "wagmi";
import { useSIWE } from "../../hooks/useSIWE";
import { Button } from "../ui/button";
import { SIWEButton } from "./SIWEButton";

interface SIWEModalProps {
  isOpen: boolean;
  onClose: () => void;
  requireSIWE?: boolean;
  onAuthComplete?: () => void;
}

export function SIWEModal({
  isOpen,
  onClose,
  requireSIWE = true,
  onAuthComplete,
}: Readonly<SIWEModalProps>) {
  const { isConnected, address } = useAccount();
  const { isSignedIn } = useSIWE();
  const { open } = useAppKit();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-8 border max-w-md w-full relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Secure Authentication Required
          </h1>
          <p className="text-gray-600 text-sm">
            Access the confidential KYC platform
          </p>
        </div>

        {/* Authentication Steps */}
        <div className="space-y-6">
          {/* Step 1: Connect Wallet */}
          <div className="flex items-start space-x-4">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                isConnected
                  ? "bg-green-100 text-green-700"
                  : "bg-blue-100 text-blue-700"
              }`}
            >
              {isConnected ? "✓" : "1"}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2">
                Connect Your Wallet
              </h3>
              {isConnected ? (
                <div className="text-sm text-green-700 bg-green-50 p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Wallet className="w-4 h-4" />
                    <span>
                      Connected: {address?.slice(0, 8)}...{address?.slice(-6)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 mb-3">
                    Connect your Web3 wallet to access the platform
                  </p>
                  <Button
                    onClick={() => open({ view: "Connect" })}
                    size="lg"
                    className="w-full"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Connect Wallet
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Step 2: Sign In With Ethereum */}
          {isConnected && requireSIWE && (
            <div className="flex items-start space-x-4">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  isSignedIn
                    ? "bg-green-100 text-green-700"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                {isSignedIn ? "✓" : "2"}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Sign In With Ethereum
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Create a secure session for seamless iExec operations
                </p>
                <SIWEButton
                  size="lg"
                  className="w-full"
                  onSignInSuccess={onAuthComplete}
                />
              </div>
            </div>
          )}
        </div>

        {/* Continue Button - shows after successful authentication */}
        {isConnected && (!requireSIWE || isSignedIn) && (
          <div className="mt-6 pt-6 border-t">
            <Button
              onClick={() => {
                onClose();
                if (onAuthComplete) {
                  onAuthComplete();
                }
              }}
              size="lg"
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Continue to KYC Platform
            </Button>
          </div>
        )}

        {/* Security Notice */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start space-x-3">
            <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-blue-800 mb-1">
                Why do we need both steps?
              </p>
              <ul className="text-blue-700 space-y-1">
                <li>
                  • <strong>Wallet Connection:</strong> Identifies you on the
                  blockchain
                </li>
                <li>
                  • <strong>SIWE Signature:</strong> Creates a secure session
                  for KYC operations
                </li>
                <li>
                  • <strong>No Gas Fees:</strong> Signing is free, only
                  verification uses gas
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-gray-500">
          <p>Powered by iExec Confidential Computing</p>
        </div>
      </div>
    </div>
  );
}
