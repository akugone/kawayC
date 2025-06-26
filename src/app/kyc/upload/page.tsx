"use client";

import { DocumentUpload } from "@/components/kyc/DocumentUpload";
import { Button } from "@/components/ui/button";
import { DebugSection } from "@/components/ui/debug-section";
import { useSimpleKycFlow } from "@/hooks/useSimpleKycFlow";
import { prepareSimpleKYCData } from "@/lib/simplified-kyc-data";
import { IExecDataProtectorCore } from "@iexec/dataprotector";
import { ArrowLeft, RefreshCw, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

export default function KYCUploadPage() {
  const router = useRouter();
  const { isConnected, connector } = useAccount();
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

  const [dataProtectorCore, setDataProtectorCore] =
    useState<IExecDataProtectorCore | null>(null);

  // Initialize DataProtector
  useEffect(() => {
    if (!isConnected) {
      router.push("/");
      return;
    }

    const initializeDataProtector = async () => {
      if (isConnected && connector) {
        try {
          const provider = await connector.getProvider();
          const { IExecDataProtector } = await import("@iexec/dataprotector");
          const dataProtector = new IExecDataProtector(provider as any);
          setDataProtectorCore(dataProtector.core);
        } catch (error) {
          console.error("Failed to initialize DataProtector:", error);
          setError("Failed to initialize secure connection");
        }
      }
    };
    initializeDataProtector();
  }, [isConnected, connector, router, setError]);

  // Check if user has processing state but no documents (page refresh scenario)
  const hasProcessingStateButNoDocuments =
    kycFlow.processing && Object.keys(kycFlow.documents).length === 0;

  // Main processing function
  const handleProtectAndProcess = async () => {
    console.log("🚀 handleProtectAndProcess called");
    console.log("📊 Current state:", {
      canProcess,
      isReady,
      documentsCount: Object.keys(kycFlow.documents).length,
      processing: kycFlow.processing,
      protectedDataAddress: kycFlow.protectedDataAddress,
    });

    if (!canProcess) {
      console.log("❌ Cannot process - conditions not met");
      return;
    }

    try {
      // Prepare the simple KYC data format
      updateStatus("Preparing documents...");
      const simpleKYCData = await prepareSimpleKYCData(kycFlow.documents);

      console.log("📋 Simple KYC data prepared:", {
        hasSelfie: !!simpleKYCData.selfie,
        hasId: !!simpleKYCData.id,
        hasAddressProof: !!simpleKYCData.addressProof,
        totalSize:
          simpleKYCData.selfie.length +
          simpleKYCData.id.length +
          simpleKYCData.addressProof.length,
      });

      if (!dataProtectorCore) {
        throw new Error("DataProtector not initialized");
      }

      console.log("🔒 Using actual DataProtector");

      // 1. Protect the data
      updateStatus("Encrypting documents securely...");
      const protectedData = await dataProtectorCore.protectData({
        name: `KYC-${Date.now()}`,
        data: simpleKYCData,
        onStatusUpdate: ({ title, isDone }) => {
          console.log(`🔐 DataProtector: ${title}`, { isDone });
          updateStatus(`Encrypting: ${title}`);
        },
      });

      console.log("✅ Data protected:", protectedData.address);

      // 2. Grant access to your iExec KYC app
      const appAddress = process.env.NEXT_PUBLIC_IEXEC_KYC_APP_ADDRESS;
      if (!appAddress) {
        throw new Error("KYC app address not configured in environment");
      }

      updateStatus("Configuring secure access...");
      await dataProtectorCore.grantAccess({
        protectedData: protectedData.address,
        authorizedApp: appAddress,
        authorizedUser: "0x0000000000000000000000000000000000000000",
        pricePerAccess: 0,
        numberOfAccess: 1,
        onStatusUpdate: ({ title, isDone }) => {
          console.log(`🔑 Grant Access: ${title}`, { isDone });
          updateStatus(`Access: ${title}`);
        },
      });

      console.log("✅ Access granted to KYC app");
      startProcessing(protectedData.address);

      // 3. Redirect to processing page
      console.log("⏳ Scheduling redirect to processing page...");
      setTimeout(() => {
        console.log("🔄 Redirecting to /kyc/processing");
        router.push("/kyc/processing");
      }, 2000);
    } catch (error: any) {
      console.error("❌ KYC Upload Error:", error);
      setError(error.message ?? "Failed to process documents");
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Wallet not connected</h1>
          <Button onClick={() => router.push("/")}>Connect Wallet</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Page Refresh Warning */}
      {hasProcessingStateButNoDocuments && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 text-orange-600">⚠️</div>
            <div>
              <p className="font-semibold text-orange-800">
                Page Refresh Detected
              </p>
              <p className="text-orange-700 text-sm">
                Your processing state was preserved, but you need to re-upload
                your documents to continue.
                {kycFlow.protectedDataAddress && (
                  <span className="block mt-1">
                    Protected data address:{" "}
                    {kycFlow.protectedDataAddress.slice(0, 10)}...
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Button variant="ghost" onClick={() => router.push("/kyc")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="text-center">
          <h1 className="text-3xl font-bold">Upload Documents</h1>
          <p className="text-gray-600">Upload your 3 identity documents</p>
        </div>
        <div className="w-16" /> {/* Spacer for centering */}
      </div>

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
          disabled={
            kycFlow.processing && Object.keys(kycFlow.documents).length === 3
          }
        />
        <DocumentUpload
          type="id"
          document={kycFlow.documents.id}
          onDocumentAdd={addDocument}
          onDocumentRemove={removeDocument}
          disabled={
            kycFlow.processing && Object.keys(kycFlow.documents).length === 3
          }
        />
        <DocumentUpload
          type="addressProof"
          document={kycFlow.documents.addressProof}
          onDocumentAdd={addDocument}
          onDocumentRemove={removeDocument}
          disabled={
            kycFlow.processing && Object.keys(kycFlow.documents).length === 3
          }
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
                width: `${(Object.keys(kycFlow.documents).length / 3) * 100}%`,
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
          disabled={!canProcess || !dataProtectorCore}
          size="lg"
          className="min-w-48"
        >
          {(() => {
            if (kycFlow.processing) {
              return "Processing...";
            }
            if (isReady) {
              return (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Start Confidential Verification
                </>
              );
            }
            return `Upload ${
              3 - Object.keys(kycFlow.documents).length
            } more documents`;
          })()}
        </Button>

        {/* Continue Processing Button for page refresh scenario */}
        {hasProcessingStateButNoDocuments && kycFlow.protectedDataAddress && (
          <div className="mt-4 space-y-3">
            <Button
              onClick={() => router.push("/kyc/processing")}
              variant="outline"
              size="lg"
              className="min-w-48"
            >
              Continue Processing
            </Button>
            <Button
              onClick={() => {
                // Clear the localStorage state
                localStorage.removeItem("kyc-flow-state");
                // Reset the flow
                window.location.reload();
              }}
              variant="destructive"
              size="sm"
              className="min-w-48"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Clear Session & Start Fresh
            </Button>
            <p className="text-xs text-gray-500">
              Choose to continue with existing processing or clear everything
              and start over
            </p>
          </div>
        )}
      </div>

      {/* Debug Info */}
      <DebugSection
        data={{
          documentsCount: Object.keys(kycFlow.documents).length,
          isReady,
          canProcess,
          dataProtectorReady: !!dataProtectorCore,
          protectedDataAddress: kycFlow.protectedDataAddress,
          hasProcessingStateButNoDocuments,
          workflow: "Upload → Protect → Grant → Process → Results",
        }}
      />
    </div>
  );
}
