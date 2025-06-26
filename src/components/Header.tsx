"use client";

import { Button } from "@/components/ui/button";
import { useAppKit } from "@reown/appkit/react";
import { Shield, User } from "lucide-react";
import Link from "next/link";
import { useAccount, useDisconnect } from "wagmi";

export function Header() {
  const { isConnected, address } = useAccount();
  const { disconnectAsync } = useDisconnect();
  const { open } = useAppKit();

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

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-50 w-full">
      <div className="flex justify-between items-center w-full px-4 py-4">
        <Link
          href="/"
          className="flex items-center space-x-3 hover:opacity-80 transition"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg">KawaiC</h1>
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
              <Button onClick={logout} variant="outline">
                Disconnect
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
