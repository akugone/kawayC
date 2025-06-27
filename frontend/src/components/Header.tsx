"use client";

import { useAppKit } from "@reown/appkit/react";
import { CheckCircle, LogOut, Shield, User, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useAccount, useDisconnect } from "wagmi";
import { useSIWE } from "../hooks/useSIWE";
import { SIWEModal } from "./auth/SIWEModal";
import { Button } from "./ui/button";

export function Header() {
  const { isConnected, address } = useAccount();
  const { disconnectAsync } = useDisconnect();
  const { open } = useAppKit();
  const { isSignedIn, signOut, timeUntilExpiry } = useSIWE();
  const [isSIWEModalOpen, setIsSIWEModalOpen] = useState(false);
  const [isSIWESessionModalOpen, setIsSIWESessionModalOpen] = useState(false);

  const login = () => {
    open({ view: "Connect" });
  };

  const logout = async () => {
    try {
      await disconnectAsync();
    } catch (err) {
      console.error("Failed to logout:", err);
    }
  };

  const handleSIWESignOut = () => {
    signOut();
    setIsSIWESessionModalOpen(false);
  };

  const openSIWEModal = () => {
    setIsSIWEModalOpen(true);
  };

  const closeSIWEModal = () => {
    setIsSIWEModalOpen(false);
  };

  const openSIWESessionModal = () => {
    setIsSIWESessionModalOpen(true);
  };

  const closeSIWESessionModal = () => {
    setIsSIWESessionModalOpen(false);
  };

  const formatTimeRemaining = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <>
      <nav className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-50 w-full">
        <div className="flex justify-between items-center w-full px-4 py-4">
          <Link
            href="/"
            className="flex items-center space-x-3 hover:opacity-80 transition"
          >
            <img
              src="/images/logo.png"
              alt="KawaiiC Logo"
              className="w-8 h-8 rounded"
            />
            <div>
              <h1 className="font-bold text-lg">KawaiiC</h1>
              <p className="text-xs text-gray-600">Powered by iExec TEEs</p>
            </div>
          </Link>
          <div className="flex items-center space-x-4">
            {!isConnected ? (
              <Button onClick={login} size="lg">
                <User className="w-4 h-4 mr-2" />
                Connect Wallet
              </Button>
            ) : (
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium">Connected</p>
                  <p className="text-xs text-gray-600">
                    {address?.slice(0, 8)}...{address?.slice(-6)}
                  </p>
                </div>

                {/* SIWE Status Button */}
                <div className="flex items-center space-x-2">
                  {isSignedIn ? (
                    <Button
                      onClick={openSIWESessionModal}
                      variant="outline"
                      size="sm"
                      className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      SIWE Active
                    </Button>
                  ) : (
                    <Button
                      onClick={openSIWEModal}
                      variant="outline"
                      size="sm"
                      className="bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
                    >
                      <Shield className="w-4 h-4 mr-1" />
                      Sign SIWE
                    </Button>
                  )}

                  <Button onClick={logout} variant="outline" size="sm">
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* SIWE Modal */}
      <SIWEModal
        isOpen={isSIWEModalOpen}
        onClose={closeSIWEModal}
        requireSIWE={true}
        onAuthComplete={() => {
          console.log("✅ SIWE authentication completed");
          closeSIWEModal();
        }}
      />

      {/* SIWE Session Info Modal */}
      {isSIWESessionModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-8 border max-w-md w-full relative">
            {/* Close Button */}
            <button
              onClick={closeSIWESessionModal}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-green-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                SIWE Session Active
              </h1>
              <p className="text-gray-600 text-sm">
                Your secure session is active and ready for KYC operations
              </p>
            </div>

            {/* Session Info */}
            <div className="space-y-4 mb-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">Session Status</p>
                    <p className="text-sm text-green-600">
                      Active • Expires in {formatTimeRemaining(timeUntilExpiry)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-800">KYC Operations</p>
                    <p className="text-sm text-blue-600">
                      Ready for seamless document processing
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Button
                onClick={closeSIWESessionModal}
                variant="outline"
                className="w-full"
              >
                Continue Using Session
              </Button>
              <Button
                onClick={handleSIWESignOut}
                variant="outline"
                className="w-full text-red-600 border-red-300 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out SIWE
              </Button>
            </div>

            {/* Footer */}
            <div className="mt-6 text-center text-xs text-gray-500">
              <p>Powered by iExec Confidential Computing</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
