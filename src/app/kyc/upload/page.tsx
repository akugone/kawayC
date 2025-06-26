"use client";

import { DocumentUpload } from "@/components/kyc/DocumentUpload";
import { Button } from "@/components/ui/button";
import { DebugSection } from "@/components/ui/debug-section";
import { useKycFlow } from "@/hooks/useKycFlow";
import { IExecDataProtectorCore } from "@iexec/dataprotector";
import { ArrowLeft, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

export default function KYCUploadPage() {
  const router = useRouter();
  const { isConnected, connector } = useAccount();
  const {
    kycFlow,
    addDocument,
    removeDocument,
    setProtectedDataAddress,
    setError,
    updateStep,
  } = useKycFlow();

  const [dataProtectorCore, setDataProtectorCore] =
    useState<IExecDataProtectorCore | null>(null);
  const [protecting, setProtecting] = useState(false);

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

  const handleProtectDocuments = async () => {
    if (
      !dataProtectorCore ||
      !kycFlow.documents.selfie ||
      !kycFlow.documents.id ||
      !kycFlow.documents.addressProof
    ) {
      setError("Please upload all required documents");
      return;
    }

    setProtecting(true);
    setError("");

    try {
      // Prepare data for protection
      const documentsData = {
        selfie: {
          filename: kycFlow.documents.selfie.file.name,
          data: kycFlow.documents.selfie.base64,
          type: kycFlow.documents.selfie.file.type,
        },
        id: {
          filename: kycFlow.documents.id.file.name,
          data: kycFlow.documents.id.base64,
          type: kycFlow.documents.id.file.type,
        },
        addressProof: {
          filename: kycFlow.documents.addressProof.file.name,
          data: kycFlow.documents.addressProof.base64,
          type: kycFlow.documents.addressProof.file.type,
        },
        timestamp: Date.now(),
        kycType: "ConfidentialKYCDocuments",
      };

      console.log("Protecting KYC documents...", {
        selfieSize: documentsData.selfie.data.length,
        idSize: documentsData.id.data.length,
        addressProofSize: documentsData.addressProof.data.length,
      });

      const protectedData = await dataProtectorCore.protectData({
        data: documentsData,
        name: `KYC-Documents-${Date.now()}`,
      });

      console.log("Protected Data created:", protectedData);

      setProtectedDataAddress(protectedData.address);
      updateStep(3);

      // Navigate to processing page
      router.push("/kyc/processing");
    } catch (error) {
      console.error("Error protecting documents:", error);
      setError(`Failed to protect documents: ${error}`);
    } finally {
      setProtecting(false);
    }
  };

  const allDocumentsUploaded =
    kycFlow.documents.selfie &&
    kycFlow.documents.id &&
    kycFlow.documents.addressProof;

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

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => router.push("/kyc")}
            className="mr-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
        <div>
          <h1 className="text-3xl font-bold">Upload Documents</h1>
          <p className="text-gray-600">
            Upload your identity documents for secure verification
          </p>
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
        <div className="flex items-start space-x-3">
          <Shield className="w-6 h-6 text-blue-500 mt-1" />
          <div>
            <h3 className="font-semibold text-blue-800 mb-2">
              Your Privacy is Protected
            </h3>
            <div className="text-blue-700 text-sm space-y-1">
              <p>• Your documents are encrypted before leaving your device</p>
              <p>• Only AI algorithms in secure enclaves can process them</p>
              <p>• Original documents are never stored or exposed</p>
              <p>
                • Only age verification and country are revealed after
                processing
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Document Upload Grid */}
      <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <DocumentUpload
          type="selfie"
          document={kycFlow.documents.selfie}
          onDocumentAdd={addDocument}
          onDocumentRemove={removeDocument}
          disabled={protecting}
        />

        <DocumentUpload
          type="id"
          document={kycFlow.documents.id}
          onDocumentAdd={addDocument}
          onDocumentRemove={removeDocument}
          disabled={protecting}
        />

        <DocumentUpload
          type="addressProof"
          document={kycFlow.documents.addressProof}
          onDocumentAdd={addDocument}
          onDocumentRemove={removeDocument}
          disabled={protecting}
        />
      </div>

      {/* Progress & Actions */}
      <div className="bg-white border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold">Upload Progress</h3>
            <p className="text-sm text-gray-600">
              {Object.keys(kycFlow.documents).length} of 3 documents uploaded
            </p>
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {Math.round((Object.keys(kycFlow.documents).length / 3) * 100)}%
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${(Object.keys(kycFlow.documents).length / 3) * 100}%`,
            }}
          ></div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {!allDocumentsUploaded && (
              <p>Please upload all required documents to proceed</p>
            )}
            {allDocumentsUploaded && !protecting && (
              <p className="text-green-600">
                ✅ All documents ready for secure processing
              </p>
            )}
          </div>

          <Button
            onClick={handleProtectDocuments}
            disabled={!allDocumentsUploaded || protecting || !dataProtectorCore}
            size="lg"
          >
            {protecting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Encrypting...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4 mr-2" />
                Secure & Process Documents
              </>
            )}
          </Button>
        </div>

        {kycFlow.error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {kycFlow.error}
          </div>
        )}
      </div>

      {/* Technical Details (for demo) */}
      <DebugSection
        data={{
          dataProtectorReady: !!dataProtectorCore,
          documents: Object.keys(kycFlow.documents),
          protectedAddress: kycFlow.protectedDataAddress ?? "Not set",
        }}
        title="Technical Details"
      />
    </div>
  );
}
