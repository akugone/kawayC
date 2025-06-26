"use client";

import { useAppKit } from "@reown/appkit/react";
import {
  ArrowRight,
  CheckCircle,
  FileText,
  Shield,
  Smartphone,
  User,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAccount } from "wagmi";
import { Button } from "../components/ui/button";

export default function Home() {
  const router = useRouter();
  const { open } = useAppKit();
  const { isConnected } = useAccount();

  // Update page title based on connection status
  useEffect(() => {
    document.title = isConnected
      ? "Start KYC | Confidential KYC Verification"
      : "Connect Wallet | Confidential KYC Verification";
  }, [isConnected]);

  const login = () => {
    open({ view: "Connect" });
  };

  const startKYC = () => {
    router.push("/kyc");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="mb-8">
            <div className="inline-flex items-center bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              🏆 Winner of iHackathon 2025 - Innovation Track
            </div>
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
              Confidential KYC Verification
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Verify your identity while keeping your documents completely
              private. Revolutionary KYC powered by iExec's Trusted Execution
              Environment.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            {isConnected ? (
              <Button
                onClick={startKYC}
                size="lg"
                className="text-lg px-8 py-6"
              >
                <Shield className="w-5 h-5 mr-2" />
                Start KYC Verification
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            ) : (
              <Button onClick={login} size="lg" className="text-lg px-8 py-6">
                <User className="w-5 h-5 mr-2" />
                Connect Wallet to Start
              </Button>
            )}
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white/60 backdrop-blur-sm border rounded-2xl p-8 hover:shadow-lg transition-all">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4">100% Confidential</h3>
              <p className="text-gray-600">
                Your documents are processed in a secure enclave. Original files
                never leave the TEE environment.
              </p>
            </div>

            <div className="bg-white/60 backdrop-blur-sm border rounded-2xl p-8 hover:shadow-lg transition-all">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4">
                AI-Powered Verification
              </h3>
              <p className="text-gray-600">
                Advanced AI algorithms analyze your documents for instant age
                and identity verification.
              </p>
            </div>

            <div className="bg-white/60 backdrop-blur-sm border rounded-2xl p-8 hover:shadow-lg transition-all">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <Smartphone className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4">
                Mobile Wallet Integration
              </h3>
              <p className="text-gray-600">
                Get a digital ID card that you can add to Apple Wallet or Google
                Pay for easy verification.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 bg-white/40 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">
              Simple, secure, and completely private
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold mb-2">1. Connect Wallet</h3>
              <p className="text-gray-600 text-sm">
                Connect your Web3 wallet to start the verification process
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold mb-2">2. Upload Documents</h3>
              <p className="text-gray-600 text-sm">
                Upload your selfie, ID card, and proof of residence
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold mb-2">3. Secure Processing</h3>
              <p className="text-gray-600 text-sm">
                AI analyzes your documents in iExec's secure enclave
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold mb-2">4. Get Digital ID</h3>
              <p className="text-gray-600 text-sm">
                Receive your verified digital ID card for mobile wallet
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy Features */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 md:p-12 text-white">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">
                Your Privacy is Our Priority
              </h2>
              <p className="text-xl opacity-90">
                Powered by iExec's Trusted Execution Environment
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-300 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Documents Never Exposed</h4>
                    <p className="text-sm opacity-90">
                      Your original documents are processed in a secure enclave
                      and never stored or exposed
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-300 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">
                      Zero-Knowledge Verification
                    </h4>
                    <p className="text-sm opacity-90">
                      Only age verification and country are revealed, not your
                      personal details
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-300 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Blockchain Verification</h4>
                    <p className="text-sm opacity-90">
                      Results are cryptographically signed and verifiable on the
                      blockchain
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-300 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">You Control Your Data</h4>
                    <p className="text-sm opacity-90">
                      No centralized storage, you own and control your
                      verification
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold">KawaiC</h3>
          </div>
          <p className="text-gray-400 mb-4">
            Revolutionary identity verification powered by confidential
            computing
          </p>
          <p className="text-sm text-gray-500">
            Built for iHackathon 2025 • Powered by iExec DataProtector & TEE
          </p>
        </div>
      </footer>
    </div>
  );
}
