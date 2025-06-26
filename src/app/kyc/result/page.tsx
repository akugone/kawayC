"use client";

import { Button } from "@/components/ui/button";
import { DebugSection } from "@/components/ui/debug-section";
import { useKycFlow } from "@/hooks/useKycFlow";
import { WalletPass } from "@/lib/kyc-types";
import { WalletPassGenerator } from "@/lib/wallet-pass";
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Copy,
  Download,
  ExternalLink,
  MapPin,
  QrCode,
  RefreshCw,
  Share2,
  Shield,
  Smartphone,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

export default function KYCResultPage() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const { kycFlow, resetFlow } = useKycFlow();

  const [walletPass, setWalletPass] = useState<WalletPass | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [platformWallet, setPlatformWallet] = useState<
    "apple" | "google" | "both" | "none"
  >("none");

  useEffect(() => {
    if (!isConnected) {
      router.push("/");
      return;
    }

    if (!kycFlow.results || !kycFlow.protectedDataAddress) {
      router.push("/kyc");
      return;
    }

    // Generate wallet pass and QR code
    const generatePass = async () => {
      try {
        const pass = WalletPassGenerator.generateWalletURLs(
          kycFlow.results!,
          kycFlow.protectedDataAddress!
        );

        setWalletPass(pass);

        // TODO: Replace with actual QR code library
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (ctx) {
          canvas.width = 200;
          canvas.height = 200;

          // Simple QR code representation
          ctx.fillStyle = "#000";
          for (let i = 0; i < 20; i++) {
            for (let j = 0; j < 20; j++) {
              if (Math.random() > 0.5) {
                ctx.fillRect(i * 10, j * 10, 10, 10);
              }
            }
          }

          setQrCodeDataUrl(canvas.toDataURL());
        }

        // Detect platform for wallet buttons
        setPlatformWallet(WalletPassGenerator.getPlatformWalletButton());
      } catch (error) {
        console.error("Error generating wallet pass:", error);
      }
    };

    generatePass();
  }, [isConnected, router, kycFlow.results, kycFlow.protectedDataAddress]);

  const handleCopyQRData = async () => {
    if (walletPass) {
      try {
        await navigator.clipboard.writeText(walletPass.qrCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error("Failed to copy:", error);
      }
    }
  };

  const handleAddToWallet = (type: "apple" | "google") => {
    if (!walletPass) return;

    const url =
      type === "apple" ? walletPass.appleWalletUrl : walletPass.googleWalletUrl;

    // TODO: Implement proper wallet integration
    alert(`Would redirect to ${type} Wallet with pass: ${url}`);

    // Real implementation would be:
    // window.open(url, '_blank');
  };

  const handleShare = async () => {
    if (!walletPass) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "My Digital Identity Card",
          text: "My verified digital ID from iExec Confidential KYC",
          url: walletPass.passUrl,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      // Fallback to clipboard
      await navigator.clipboard.writeText(walletPass.passUrl);
      alert("Pass URL copied to clipboard!");
    }
  };

  const handleStartOver = () => {
    resetFlow();
    router.push("/kyc");
  };

  const handleReset = () => {
    // Clear localStorage
    localStorage.removeItem("kyc-flow-state");
    // Reset the flow
    resetFlow();
    // Redirect to home
    router.push("/");
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Wallet not connected</h1>
          <div className="space-y-2">
            <Button onClick={() => router.push("/")} className="mr-2">
              Connect Wallet
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!kycFlow.results) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No verification results</h1>
          <div className="space-y-2">
            <Button onClick={() => router.push("/kyc")} className="mr-2">
              Start KYC Process
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Button variant="ghost" onClick={() => router.push("/kyc")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="text-center">
          <h1 className="text-3xl font-bold">Verification Complete</h1>
          <p className="text-gray-600">Your digital identity card is ready</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
          className="text-red-600 border-red-300 hover:bg-red-50"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Reset All
        </Button>
      </div>

      {/* Success Banner */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
        <div className="flex items-center space-x-3">
          <CheckCircle className="w-8 h-8 text-green-500" />
          <div>
            <h2 className="text-2xl font-semibold text-green-800">
              Verification Successful!
            </h2>
            <p className="text-green-700">
              Your identity has been verified using confidential computing
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left Column - Digital ID Card */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-8 text-white relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div
              className="w-full h-full"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='white' fill-opacity='0.1'%3E%3Cpath d='M20 20c0 11.046-8.954 20-20 20s-20-8.954-20-20 8.954-20 20-20 20 8.954 20 20z'/%3E%3C/g%3E%3C/svg%3E")`,
              }}
            />
          </div>

          <div className="relative z-10">
            {/* Card Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-sm font-medium opacity-90">
                  DIGITAL IDENTITY CARD
                </h3>
                <p className="text-2xl font-bold">iExec KYC</p>
              </div>
              <Shield className="w-8 h-8 opacity-80" />
            </div>

            {/* Main Info */}
            <div className="space-y-4 mb-6">
              <div>
                <p className="text-sm opacity-80">Verification Status</p>
                <p className="text-xl font-semibold">
                  {kycFlow.results.kycStatus.toUpperCase()}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm opacity-80">Age Verified</p>
                  <p className="font-medium">
                    {kycFlow.results.ageValidated ? "✓ 18+" : "Not Verified"}
                  </p>
                </div>
                <div>
                  <p className="text-sm opacity-80">Country</p>
                  <p className="font-medium">
                    {kycFlow.results.countryResidence}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-between items-end text-sm opacity-80">
              <div>
                <p>
                  Issued:{" "}
                  {new Date(kycFlow.results.timestamp).toLocaleDateString()}
                </p>
                <p>Powered by iExec TEE</p>
              </div>
              <div className="text-right">
                <p>ID: {kycFlow.protectedDataAddress?.slice(-8)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - QR Code & Actions */}
        <div className="space-y-6">
          {/* QR Code */}
          <div className="bg-white border rounded-lg p-6 text-center">
            <h3 className="font-semibold mb-4 flex items-center justify-center">
              <QrCode className="w-5 h-5 mr-2" />
              Verification QR Code
            </h3>

            {qrCodeDataUrl && (
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <img
                  src={qrCodeDataUrl}
                  alt="Verification QR Code"
                  className="mx-auto mb-2"
                  style={{ width: "200px", height: "200px" }}
                />
                <p className="text-sm text-gray-600">Scan to verify identity</p>
              </div>
            )}

            <Button
              onClick={handleCopyQRData}
              variant="outline"
              size="sm"
              className="mb-2"
            >
              <Copy className="w-4 h-4 mr-2" />
              {copied ? "Copied!" : "Copy QR Data"}
            </Button>
          </div>

          {/* Wallet Actions */}
          <div className="bg-white border rounded-lg p-6">
            <h3 className="font-semibold mb-4 flex items-center">
              <Smartphone className="w-5 h-5 mr-2" />
              Add to Mobile Wallet
            </h3>

            <div className="space-y-3">
              {(platformWallet === "apple" || platformWallet === "both") && (
                <Button
                  onClick={() => handleAddToWallet("apple")}
                  className="w-full bg-black text-white hover:bg-gray-800"
                  size="lg"
                >
                  <div className="flex items-center justify-center">
                    <span className="text-lg mr-2">🍎 </span>
                    Add to Apple Wallet
                  </div>
                </Button>
              )}

              {(platformWallet === "google" || platformWallet === "both") && (
                <Button
                  onClick={() => handleAddToWallet("google")}
                  className="w-full bg-blue-600 text-white hover:bg-blue-700"
                  size="lg"
                >
                  <div className="flex items-center justify-center">
                    <span className="text-lg mr-2">📱 </span>
                    Add to Google Wallet
                  </div>
                </Button>
              )}
            </div>

            <div className="mt-4 pt-4 border-t">
              <Button
                onClick={handleShare}
                variant="outline"
                className="w-full"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share Digital ID
              </Button>
            </div>
          </div>

          {/* Additional Actions */}
          <div className="bg-white border rounded-lg p-6">
            <h3 className="font-semibold mb-4">More Actions</h3>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Certificate
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View on Blockchain
              </Button>
              <Button
                onClick={handleStartOver}
                variant="outline"
                size="sm"
                className="w-full justify-start"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Start New Verification
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Details */}
      <div className="mt-8 bg-gray-50 border rounded-lg p-6">
        <h3 className="font-semibold mb-4">Verification Details</h3>
        <div className="grid md:grid-cols-3 gap-6 text-sm">
          <div className="flex items-start space-x-3">
            <Calendar className="w-5 h-5 text-blue-500 mt-0.5" />
            <div>
              <p className="font-medium">Issue Date</p>
              <p className="text-gray-600">
                {new Date(kycFlow.results.timestamp).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <MapPin className="w-5 h-5 text-green-500 mt-0.5" />
            <div>
              <p className="font-medium">Verified Location</p>
              <p className="text-gray-600">
                {kycFlow.results.countryResidence}
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Shield className="w-5 h-5 text-purple-500 mt-0.5" />
            <div>
              <p className="font-medium">Technology</p>
              <p className="text-gray-600">
                iExec Trusted Execution Environment
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t text-xs text-gray-500">
          <p>
            <strong>Privacy Notice:</strong> This verification was performed
            using confidential computing. Your original documents were processed
            in a secure enclave and never exposed. Only age verification status
            and country of residence were computed and stored.
          </p>
        </div>
      </div>

      {/* Debug Info */}
      <DebugSection
        data={{
          results: kycFlow.results,
          protectedDataAddress: kycFlow.protectedDataAddress,
          walletPass: walletPass ? "Generated" : "Not generated",
          platform: platformWallet,
        }}
      />
    </div>
  );
}
