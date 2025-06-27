"use client";

import { ArrowLeft, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
import { LoginGated } from "../../../components/auth/LoginGated";
import { DocumentUpload } from "../../../components/kyc/DocumentUpload";
import { Button } from "../../../components/ui/button";
import { DebugSection } from "../../../components/ui/debug-section";
import { useIexecWithSIWE } from "../../../hooks/useIexecWithSIWE";
import { useSimpleKycFlow } from "../../../hooks/useSimpleKycFlow";
import {
  prepareSimpleKYCData,
  validateKYCDocuments,
} from "../../../lib/simplified-kyc-data";

// Type for iExec DataProtector status updates
interface StatusUpdate {
  title: string;
  [key: string]: any;
}

export default function KYCUploadPage() {
  const router = useRouter();
  const {
    kycFlow,
    isReady,
    canProcess,
    addDocument,
    removeDocument,
    startProcessing,
    updateStatus,
    setError,
  } = useSimpleKycFlow();

  // Use the new SIWE-enabled iExec hook
  const {
    isReady: iexecReady,
    isSignedIn,
    protectData,
    grantAccess,
    processProtectedData,
    derivedWalletAddress,
  } = useIexecWithSIWE();

  // Main processing function - Improved with proper navigation
  const handleProtectAndProcess = async () => {
    console.log("🚀 handleProtectAndProcess with SIWE session");

    if (!canProcess || !iexecReady) {
      console.log("❌ Cannot process - conditions not met");
      return;
    }

    try {
      // Validate documents before processing
      validateKYCDocuments(kycFlow.documents);

      // Prepare the simple KYC data format
      updateStatus("Preparing documents...");
      const simpleKYCData = await prepareSimpleKYCData(kycFlow.documents);

      console.log("📋 Simple KYC data prepared for SIWE wallet:", {
        derivedWalletAddress,
        hasSelfie: !!simpleKYCData.selfie,
        hasId: !!simpleKYCData.id,
        hasAddressProof: !!simpleKYCData.addressProof,
      });

      // 1. Protect the data - SEAMLESS with SIWE!
      updateStatus("Encrypting documents securely...");
      const protectedData = await protectData(simpleKYCData, {
        onStatusUpdate: ({ title }: StatusUpdate) => {
          updateStatus(`Encrypting: ${title}`);
        },
      });


      console.log("✅ Data protected seamlessly:", protectedData.address);

      // 2. Grant access to KYC app - SEAMLESS with SIWE!
      const appAddress = process.env.NEXT_PUBLIC_IEXEC_KYC_APP_ADDRESS;
      if (!appAddress) {
        throw new Error("KYC app address not configured in environment");
      }

      updateStatus("Configuring secure access...");
      const res = await grantAccess({
        protectedData: protectedData.address,
        authorizedApp: appAddress,
        authorizedUser: "0x0000000000000000000000000000000000000000",
        pricePerAccess: 0,
        numberOfAccess: 1,
        onStatusUpdate: ({ title }: StatusUpdate) => {
          updateStatus(`Access: ${title}`);
        },
      });
      console.log('grant access:', res);

      console.log("✅ Access granted seamlessly to KYC app");
      //startProcessing(protectedData.address);

      // 3. Navigate to processing page with state persistence guarantee
      updateStatus("Redirecting to processing...");

      // Ensure state is saved before navigation
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Verify state was saved correctly
      const savedState = localStorage.getItem("kyc-flow-state");
      console.log("🔍 Verifying saved state before navigation:", savedState);

      if (savedState) {
        const parsedState = JSON.parse(savedState);
        if (parsedState.protectedDataAddress) {
          console.log(
            "✅ Protected data address confirmed in localStorage:",
            parsedState.protectedDataAddress
          );
          // Use window.location for reliable navigation
          //window.location.href = "/kyc/processing";
          //await processProtectedData({ protectedData: protectedData.address, workerpool: "tdx-labs.pools.iexec.eth", app: appAddress });
        } else {
          console.error("❌ Protected data address missing from saved state");
          // Force save again and navigate with delay
          startProcessing(protectedData.address);
          setTimeout(() => {
            window.location.href = "/kyc/processing";
          }, 500);
        }
      } else {
        console.error("❌ No state found in localStorage, forcing save");
        startProcessing(protectedData.address);
        setTimeout(() => {
          window.location.href = "/kyc/processing";
        }, 500);
      }
    } catch (error: any) {
      console.error("❌ Protection/processing failed:", error);
      setError(`Failed to process documents: ${error.message}`);
    }
  };

  // Extract button text logic
  const getButtonText = () => {
    if (!canProcess) return "Upload 3 Documents";
    if (!iexecReady) return "Initializing iExec...";
    return "🚀 Start Verification";
  };

  return (
    <LoginGated requireSIWE={true}>
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={() => router.push("/kyc")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="text-center">
            <h1 className="text-3xl font-bold">Upload Documents</h1>
            <p className="text-gray-600">Seamless upload with SIWE session</p>
          </div>
          <div className="w-20" /> {/* Spacer for balance */}
        </div>

        {/* SIWE Status Banner */}
        <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <Shield className="w-6 h-6 text-green-500" />
            <div>
              <h3 className="font-semibold text-green-800">
                ✅ Secure Session Active
              </h3>
              <p className="text-green-700 text-sm">
                All operations will be seamless without additional signatures.
                Derived wallet: {derivedWalletAddress?.slice(0, 10)}...
                {derivedWalletAddress?.slice(-8)}
              </p>
            </div>
          </div>
        </div>

        {/* Confidential Processing Info */}
        <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h2 className="text-xl font-bold text-blue-800 mb-4">
            🛡️ 100% Confidential Processing
          </h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-700">
            <div>
              <h3 className="font-semibold mb-2">Privacy Guarantees:</h3>
              <ul className="space-y-1">
                <li>• Documents encrypted before leaving your device</li>
                <li>• AI processing in secure Intel SGX/TDX enclaves</li>
                <li>
                  • No additional signatures required - seamless SIWE session
                </li>
                <li>• Original documents never stored or exposed</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">What's Revealed:</h3>
              <ul className="space-y-1">
                <li>• Only age validation + country revealed</li>
                <li>• Face matching confidence score</li>
                <li>• Overall verification status</li>
                <li>• Timestamp with iExec TEE signature</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Document Upload Components */}
        <div className="space-y-6">
          <DocumentUpload
            type="selfie"
            document={kycFlow.documents.selfie}
            onDocumentAdd={addDocument}
            onDocumentRemove={removeDocument}
          />
          <DocumentUpload
            type="id"
            document={kycFlow.documents.id}
            onDocumentAdd={addDocument}
            onDocumentRemove={removeDocument}
          />
          <DocumentUpload
            type="addressProof"
            document={kycFlow.documents.addressProof}
            onDocumentAdd={addDocument}
            onDocumentRemove={removeDocument}
          />
        </div>

        {/* Progress Summary */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">Upload Progress</h3>
          <div className="text-sm space-y-1">
            <div>Documents: {Object.keys(kycFlow.documents).length}/3</div>
            <div>Ready to process: {isReady ? "✅ Yes" : "❌ No"}</div>
            <div>iExec ready: {iexecReady ? "✅ Yes" : "❌ No"}</div>
            <div>SIWE signed: {isSignedIn ? "✅ Yes" : "❌ No"}</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-center space-x-4">
          <Button
            onClick={handleProtectAndProcess}
            disabled={!canProcess || !iexecReady}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
            size="lg"
          >
            {getButtonText()}
          </Button>
        </div>

        {/* Status Message */}
        {kycFlow.statusMessage && (
          <div className="mt-4 p-3 bg-blue-100 text-blue-800 rounded text-center">
            {kycFlow.statusMessage}
          </div>
        )}

        {/* Error Message */}
        {kycFlow.error && (
          <div className="mt-4 p-3 bg-red-100 text-red-800 rounded text-center">
            ❌ {kycFlow.error}
          </div>
        )}

        {/* Debug Section */}
        <DebugSection
          data={{
            documentsCount: Object.keys(kycFlow.documents).length,
            isReady,
            canProcess,
            iexecReady,
            isSignedIn,
            derivedWalletAddress,
            protectedDataAddress: kycFlow.protectedDataAddress,
            processing: kycFlow.processing,
            statusMessage: kycFlow.statusMessage,
            appAddress: process.env.NEXT_PUBLIC_IEXEC_KYC_APP_ADDRESS,
          }}
        />
      </div>
    </LoginGated>
  );
}
