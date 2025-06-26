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
import { prepareSimpleKYCData } from "../../../lib/simplified-kyc-data";

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
    derivedWalletAddress,
  } = useIexecWithSIWE();

  // Main processing function - NOW SEAMLESS!
  const handleProtectAndProcess = async () => {
    console.log("🚀 handleProtectAndProcess with SIWE session");

    if (!canProcess || !iexecReady) {
      console.log("❌ Cannot process - conditions not met");
      return;
    }

    try {
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
      await grantAccess({
        protectedData: protectedData.address,
        authorizedApp: appAddress,
        authorizedUser: "0x0000000000000000000000000000000000000000",
        pricePerAccess: 0,
        numberOfAccess: 1,
        onStatusUpdate: ({ title }: StatusUpdate) => {
          updateStatus(`Access: ${title}`);
        },
      });

      console.log("✅ Access granted seamlessly to KYC app");
      startProcessing(protectedData.address);

      // 3. Redirect to processing page
      updateStatus("Redirecting to processing...");
      router.push("/kyc/processing");
    } catch (error: any) {
      console.error("❌ KYC Upload Error:", error);
      setError(error.message ?? "Failed to process documents");
    }
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
          <div className="w-16" /> {/* Spacer */}
        </div>

        {/* SIWE Status */}
        {isSignedIn && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-3">
              <Shield className="w-6 h-6 text-green-500" />
              <div>
                <h3 className="font-semibold text-green-800">
                  ✅ Secure Session Active
                </h3>
                <p className="text-green-700 text-sm">
                  All operations will be seamless without additional signatures.
                  Derived wallet: {derivedWalletAddress?.slice(0, 10)}...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Privacy Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="flex items-start space-x-3">
            <Shield className="w-6 h-6 text-blue-500 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-800 mb-2">
                100% Confidential Processing
              </h3>
              <div className="text-blue-700 text-sm space-y-1">
                <p>• Documents encrypted before leaving your device</p>
                <p>• AI processing in secure Intel SGX/TDX enclaves</p>
                <p>
                  • <strong>No additional signatures required</strong> -
                  seamless SIWE session
                </p>
                <p>• Only age validation + country revealed</p>
                <p>• Original documents never stored or exposed</p>
              </div>
            </div>
          </div>
        </div>

        {/* Document Upload */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <DocumentUpload
            type="selfie"
            document={kycFlow.documents.selfie}
            onDocumentAdd={addDocument}
            onDocumentRemove={removeDocument}
            disabled={kycFlow.processing}
          />
          <DocumentUpload
            type="id"
            document={kycFlow.documents.id}
            onDocumentAdd={addDocument}
            onDocumentRemove={removeDocument}
            disabled={kycFlow.processing}
          />
          <DocumentUpload
            type="addressProof"
            document={kycFlow.documents.addressProof}
            onDocumentAdd={addDocument}
            onDocumentRemove={removeDocument}
            disabled={kycFlow.processing}
          />
        </div>

        {/* Progress & Action */}
        <div className="bg-white border rounded-lg p-6 text-center">
          <div className="mb-4">
            <div className="text-2xl font-bold text-blue-600 mb-2">
              {Object.keys(kycFlow.documents).length}/3 Documents
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                style={{
                  width: `${
                    (Object.keys(kycFlow.documents).length / 3) * 100
                  }%`,
                }}
              />
            </div>
          </div>

          {kycFlow.processing && (
            <div className="mb-4 text-blue-600">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2" />
              <p className="text-sm">{kycFlow.statusMessage}</p>
            </div>
          )}

          {kycFlow.error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {kycFlow.error}
            </div>
          )}

          <Button
            onClick={handleProtectAndProcess}
            disabled={!canProcess || !iexecReady}
            size="lg"
            className="min-w-48"
          >
            {(() => {
              if (kycFlow.processing) {
                return "Processing Seamlessly...";
              }
              if (isReady && iexecReady) {
                return (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Start Confidential Verification
                    <span className="ml-2 text-xs opacity-75">
                      (No extra signatures!)
                    </span>
                  </>
                );
              }
              if (!iexecReady) {
                return "Initializing SIWE session...";
              }
              return `Upload ${
                3 - Object.keys(kycFlow.documents).length
              } more documents`;
            })()}
          </Button>
        </div>

        {/* Debug Info */}
        <DebugSection
          data={{
            documentsCount: Object.keys(kycFlow.documents).length,
            isReady,
            canProcess,
            iexecReady,
            isSignedIn,
            derivedWalletAddress,
            siweSession: "Active - No additional signatures needed!",
          }}
        />
      </div>
    </LoginGated>
  );
}
