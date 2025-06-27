"use client";

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
import { LoginGated } from "../../../components/auth/LoginGated";
import { Button } from "../../../components/ui/button";
import { DebugSection } from "../../../components/ui/debug-section";
import { useKycFlow } from "../../../hooks/useKycFlow";
import { WalletPass } from "../../../lib/kyc-types";
import { WalletPassGenerator } from "../../../lib/wallet-pass";
import JSZip from "jszip";
import QRCode from "qrcode";
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
const firebaseConfig = {
  apiKey: "AIzaSyBenguXN91RYgpv8yU0QUj5PZHBxvgLefQ",
  authDomain: "test-4d27a.firebaseapp.com",
  projectId: "test-4d27a",
  storageBucket: "test-4d27a.firebasestorage.app",
  messagingSenderId: "327411071285",
  appId: "1:327411071285:web:051b9a3cd81fbcdab5b47c",
  measurementId: "G-CYXQQ6V5PZ"
};

const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);
export default function KYCResultPage() {
  const router = useRouter();
  const { kycFlow, resetFlow } = useKycFlow();
  const fakeResults = {
    taskId: "0xb24b8ce11d513e4a7e2039179c0b88a63d9fac8c7f4e3824c5f29bc1a7a42a1b",
    ageValidated: true,
    countryResidence: "France",
    kycStatus: "valid",
    timestamp: Date.now(),
  };

  if (!kycFlow.results) {
    kycFlow.results = fakeResults as any;
  }
  if (!kycFlow.protectedDataAddress) {
    kycFlow.protectedDataAddress = "0x8a77cab4a285de8a3e937597558b60eac26b844e";
  }
  const [walletPass, setWalletPass] = useState<WalletPass | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [platformWallet, setPlatformWallet] = useState<
    "apple" | "google" | "both" | "none"
  >("none");
  const [isLoading, setIsLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    console.log("🔍 RESULT PAGE - Starting result check process");

    const checkResults = () => {
      // Check localStorage directly first
      const rawState = localStorage.getItem("kyc-flow-state");
      let hasResultsInStorage = false;
      let storageResults = null;

      if (rawState) {
        try {
          const parsedState = JSON.parse(rawState);
          hasResultsInStorage = !!parsedState.results;
          storageResults = parsedState.results;
        } catch (e) {
          console.error("Failed to parse localStorage:", e);
        }
      }

      const debugData = {
        hookHasResults: !!kycFlow.results,
        storageHasResults: hasResultsInStorage,
        hookResults: kycFlow.results,
        storageResults,
        timestamp: new Date().toLocaleTimeString(),
      };

      console.log("🔍 RESULT PAGE - Debug info:", debugData);
      setDebugInfo(debugData);

      // If we have results in either place, we're good
      if (kycFlow.results || hasResultsInStorage) {
        console.log("✅ RESULT PAGE - Results found, staying on page");
        setIsLoading(false);
        return true;
      }

      return false;
    };

    // Check immediately
    if (checkResults()) {
      return;
    }

    // Check again after 1 second (for state loading)
    const timeout1 = setTimeout(() => {
      if (checkResults()) {
        return;
      }
      console.log("⏳ RESULT PAGE - Still waiting for results...");
    }, 1000);

    // Check again after 3 seconds (final check)
    const timeout2 = setTimeout(() => {
      if (!checkResults()) {
        console.log(
          "❌ RESULT PAGE - No results found after 3 seconds, redirecting"
        );
        router.push("/kyc/upload");
      }
    }, 3000);

    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
    };
  }, [kycFlow.results, router]);

  useEffect(() => {
    const taskId = kycFlow.results?.taskId ?? "0xb24b8ce11d513e4a7e2039179c0b88a63d9fac8c7f4e3824c5f29bc1a7a42a1b";

    if (!taskId || !kycFlow.protectedDataAddress) return;

    const generateKycPkpassWithTaskId = async (taskId: string): Promise<Blob> => {
      const zip = new JSZip();

      const passJson = {
        description: "KYC Proof",
        formatVersion: 1,
        organizationName: "Your KYC Demo",
        passTypeIdentifier: "pass.fake.kyc",
        serialNumber: taskId,
        teamIdentifier: "FAKE123456",
        generic: {
          primaryFields: [
            {
              key: "taskId",
              label: "Task ID",
              value: taskId,
            },
          ],
        },
        barcode: {
          format: "PKBarcodeFormatQR",
          message: `kyc:${taskId}`,
          messageEncoding: "iso-8859-1",
        },
      };

      zip.file("pass.json", JSON.stringify(passJson, null, 2));

      const placeholderImg = "https://i.ibb.co/PzsTLdJF/Illustration-sans-titre.jpg";
      const imgBlob = await fetch(placeholderImg).then((res) => res.blob());
      const imgBuffer = await imgBlob.arrayBuffer();

      zip.file("icon.png", imgBuffer);
      zip.file("logo.png", imgBuffer);

      return zip.generateAsync({ type: "blob" });
    };
    async function uploadPkpass(blob: Blob, taskId: string): Promise<string> {
      const fileRef = ref(storage, `kyc-passes/${taskId}.pkpass`);
      await uploadBytes(fileRef, blob, {
        contentType: "application/vnd.apple.pkpass",
      });

      const url = await getDownloadURL(fileRef);
      return url; // This can be used to generate a QR code
    }




    const generatePass = async (taskId: string) => {
      try {
        const blob = await generateKycPkpassWithTaskId(taskId);
        const tmpFileUrl = await uploadPkpass(blob, taskId);

        if (!tmpFileUrl) {
          throw new Error("Upload failed");
        }

        const qrCodeDataUrl = await QRCode.toDataURL(tmpFileUrl, {
          width: 256,
          errorCorrectionLevel: "H",
        });

        setQrCodeDataUrl(qrCodeDataUrl);
        console.log("✅ QR code generated with uploaded .pkpass URL");
      } catch (err) {
        console.error("❌ Failed to generate KYC pass and QR code:", err);
      }
    };


    generatePass(kycFlow.results?.taskId as any);
  }, [kycFlow.results, kycFlow.protectedDataAddress]);


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
    router.push("/kyc/upload");
  };

  const handleReset = () => {
    // Clear localStorage
    localStorage.removeItem("kyc-flow-state");
    // Reset the flow
    resetFlow();
    // Redirect to home
    router.push("/");
  };

  // Show loading state while checking for results
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold mb-4">Loading Results...</h1>
          <p className="text-gray-600 mb-4">
            Retrieving your verification results
          </p>

          {/* Debug info */}
          <div className="text-left bg-gray-100 p-4 rounded mt-4 text-sm">
            <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>
        </div>
      </div>
    );
  }

  // Show no results state (only after timeout)
  if (!kycFlow.results) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">
            No verification results found
          </h1>
          <p className="text-gray-600 mb-6">
            Please complete the KYC verification process first.
          </p>
          <div className="space-y-2">
            <Button onClick={() => router.push("/kyc/upload")} className="mr-2">
              Start KYC Process
            </Button>
          </div>

          {/* Debug info */}
          <div className="text-left bg-gray-100 p-4 rounded mt-4 text-sm">
            <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>
        </div>
      </div>
    );
  }

  return (
    <LoginGated requireSIWE={true}>
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={() => router.push("/kyc/upload")}>
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
              <canvas id="kyc-qr-canvas" className="mx-auto mb-4" width={256} height={256}></canvas>
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
              using confidential computing. Your original documents were
              processed in a secure enclave and never exposed. Only age
              verification status and country of residence were computed and
              stored.
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
            siweSession: "Active - No additional signatures needed!",
            debugInfo,
          }}
        />
      </div>
    </LoginGated>
  );
}
