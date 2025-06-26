"use client";

import {
  AlertCircle,
  Apple,
  CheckCircle,
  Chrome,
  Download,
  ExternalLink,
  Loader2,
  Smartphone,
} from "lucide-react";
import { useEffect, useState } from "react";
import { KYCResults } from "../../lib/kyc-types";
import { WalletPassGenerator } from "../../lib/wallet-pass";
import { Button } from "../ui/button";
import { DebugSection } from "../ui/debug-section";

interface WalletPassCreatorProps {
  results: KYCResults;
  protectedDataAddress: string;
  onPassGenerated?: (passUrls: any) => void;
}

export function WalletPassCreator({
  results,
  protectedDataAddress,
  onPassGenerated,
}: Readonly<WalletPassCreatorProps>) {
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [error, setError] = useState<string>("");
  const [platform, setPlatform] = useState<
    "apple" | "google" | "both" | "none"
  >("none");
  const [passUrls, setPassUrls] = useState<any>(null);

  useEffect(() => {
    // Detect platform
    const detectedPlatform = WalletPassGenerator.getPlatformWalletButton();
    setPlatform(detectedPlatform);
  }, []);

  const generatePasses = async () => {
    setGenerating(true);
    setError("");

    try {
      // Generate wallet URLs
      const walletPass = WalletPassGenerator.generateWalletURLs(
        results,
        protectedDataAddress
      );

      // Generate actual pass files
      const applePass = await WalletPassGenerator.generateAppleWalletPass(
        results,
        protectedDataAddress
      );
      const googlePass = await WalletPassGenerator.generateGoogleWalletPass(
        results,
        protectedDataAddress
      );

      const urls = {
        ...walletPass,
        applePassData: applePass,
        googlePassData: googlePass,
        downloadUrls: {
          apple: `data:application/vnd.apple.pkpass;base64,${btoa(applePass)}`,
          google: `data:application/json;base64,${btoa(googlePass)}`,
        },
      };

      setPassUrls(urls);
      setGenerated(true);

      if (onPassGenerated) {
        onPassGenerated(urls);
      }
    } catch (err) {
      setError(`Failed to generate wallet passes: ${err}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleAddToWallet = async (type: "apple" | "google") => {
    if (!passUrls) return;

    try {
      if (type === "apple") {
        // TODO: Implement proper Apple Wallet integration
        const appleUrl = `https://wallet.apple.com/pass/${passUrls.passUrl}`;
        window.open(appleUrl, "_blank");
      } else {
        // TODO: Implement proper Google Wallet integration
        const googleUrl = `https://pay.google.com/gp/v/save/${passUrls.googleWalletUrl}`;
        window.open(googleUrl, "_blank");
      }
    } catch (error) {
      console.error(`Error adding to ${type} wallet:`, error);
      setError(`Failed to add to ${type} wallet`);
    }
  };

  const handleDownloadPass = (type: "apple" | "google") => {
    if (!passUrls) return;

    const link = document.createElement("a");
    link.href = passUrls.downloadUrls[type];
    link.download = `kyc-pass-${protectedDataAddress.slice(-8)}.${
      type === "apple" ? "pkpass" : "json"
    }`;
    link.click();
  };

  const getPlatformIcon = (type: "apple" | "google") => {
    return type === "apple" ? (
      <Apple className="w-5 h-5" />
    ) : (
      <Chrome className="w-5 h-5" />
    );
  };

  return (
    <div className="space-y-6">
      {/* Generation Status */}
      <div className="text-center">
        {!generated && !generating && (
          <div>
            <Smartphone className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Generate Mobile Wallet Pass
            </h3>
            <p className="text-gray-600 mb-4">
              Create a digital ID card for your mobile wallet
            </p>
            <Button onClick={generatePasses} size="lg">
              <Smartphone className="w-4 h-4 mr-2" />
              Generate Wallet Passes
            </Button>
          </div>
        )}

        {generating && (
          <div>
            <Loader2 className="w-16 h-16 mx-auto text-blue-500 animate-spin mb-4" />
            <h3 className="text-lg font-semibold mb-2">Generating Passes...</h3>
            <p className="text-gray-600">
              Creating your digital identity cards for mobile wallets
            </p>
          </div>
        )}

        {generated && !error && (
          <div>
            <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-green-800">
              Passes Generated!
            </h3>
            <p className="text-gray-600">
              Your digital ID cards are ready to add to your mobile wallet
            </p>
          </div>
        )}

        {error && (
          <div>
            <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-red-800">
              Generation Failed
            </h3>
            <p className="text-red-600 text-sm">{error}</p>
            <Button onClick={generatePasses} variant="outline" className="mt-2">
              Try Again
            </Button>
          </div>
        )}
      </div>

      {/* Wallet Actions */}
      {generated && passUrls && (
        <div className="space-y-4">
          <div className="text-center">
            <h4 className="font-semibold mb-4">Add to Your Wallet</h4>
          </div>

          {/* Platform-specific buttons */}
          <div className="grid gap-3">
            {(platform === "apple" || platform === "both") && (
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
                    <Apple className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-medium">Apple Wallet</p>
                    <p className="text-sm text-gray-600">
                      Add to iPhone/Apple Watch
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => handleAddToWallet("apple")}
                    size="sm"
                    className="bg-black text-white hover:bg-gray-800"
                  >
                    Add to Wallet
                  </Button>
                  <Button
                    onClick={() => handleDownloadPass("apple")}
                    variant="outline"
                    size="sm"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {(platform === "google" || platform === "both") && (
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Chrome className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-medium">Google Wallet</p>
                    <p className="text-sm text-gray-600">
                      Add to Android device
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => handleAddToWallet("google")}
                    size="sm"
                    className="bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Add to Wallet
                  </Button>
                  <Button
                    onClick={() => handleDownloadPass("google")}
                    variant="outline"
                    size="sm"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Pass Preview */}
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl p-6 text-white text-center">
            <div className="mb-4">
              <h4 className="text-lg font-semibold">Digital Identity Card</h4>
              <p className="text-sm opacity-90">iExec Confidential KYC</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="opacity-80">Status</p>
                <p className="font-medium">{results.kycStatus.toUpperCase()}</p>
              </div>
              <div>
                <p className="opacity-80">Age Verified</p>
                <p className="font-medium">
                  {results.ageValidated ? "✓ 18+" : "No"}
                </p>
              </div>
              <div>
                <p className="opacity-80">Country</p>
                <p className="font-medium">{results.countryResidence}</p>
              </div>
              <div>
                <p className="opacity-80">Issued</p>
                <p className="font-medium">
                  {new Date(results.timestamp).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/20 text-xs opacity-80">
              ID: {protectedDataAddress.slice(-8)} • Powered by iExec TEE
            </div>
          </div>

          {/* Additional Actions */}
          <div className="border-t pt-4">
            <div className="flex justify-center space-x-4 text-sm">
              <button
                onClick={() =>
                  navigator.share &&
                  navigator.share({
                    title: "My Digital Identity Card",
                    text: "Verified using iExec Confidential KYC",
                    url: passUrls.passUrl,
                  })
                }
                className="flex items-center text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-2 py-1"
                aria-label="Share digital identity card"
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                Share Pass
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h5 className="font-semibold text-blue-800 mb-2">
          How to Use Your Digital ID
        </h5>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Tap "Add to Wallet" to save your ID to your phone</li>
          <li>
            • Show the pass to verify your age without revealing documents
          </li>
          <li>• Scan the QR code for instant verification</li>
          <li>• Your original documents remain completely private</li>
        </ul>
      </div>

      {/* Debug Info */}
      <DebugSection
        data={{
          platform,
          hasApplePass: !!passUrls?.applePassData,
          hasGooglePass: !!passUrls?.googlePassData,
          passUrl: passUrls?.passUrl,
        }}
        title="Pass URLs"
      />
    </div>
  );
}
