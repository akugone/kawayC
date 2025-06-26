"use client";

import { DocumentUpload } from "@/components/kyc/DocumentUpload";
import { Button } from "@/components/ui/button";
import { DebugSection } from "@/components/ui/debug-section";
import { useKycFlow } from "@/hooks/useKycFlow";
import { prepareSimpleKYCData } from "@/lib/kyc-data-structure";
import { IExecDataProtectorCore } from "@iexec/dataprotector";
import { ArrowLeft, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

export default function KYCUploadPage() {
  const router = useRouter();
  const { isConnected, connector, address } = useAccount();
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
    if (!dataProtectorCore || !allDocumentsUploaded) {
      setError("Prerequisites not met - please upload all documents");
      return;
    }

    if (!address) {
      setError("Wallet address not available");
      return;
    }

    setProtecting(true);
    setError("");

    try {
      // 1. Préparer le dataset KYC simplifié
      console.log("🔧 Preparing simplified KYC data...");
      const kycData = await prepareSimpleKYCData(kycFlow.documents);

      console.log("📊 Simplified data prepared:", {
        dataSize: JSON.stringify(kycData).length,
        hasSelfie: !!kycData.selfie,
        hasId: !!kycData.id,
        hasAddressProof: !!kycData.addressProof,
      });

      // 2. Protéger les données avec DataProtector Core
      console.log("🔐 Starting data protection...");

      const protectedData = await dataProtectorCore.protectData({
        data: kycData,
        name: `KYC-${Date.now()}`,

        // Callbacks pour status en temps réel
        onStatusUpdate: ({ title, isDone, payload }) => {
          console.log(`📡 DataProtector Status: ${title}`, { isDone, payload });

          // Update processing status using available functions
          if (isDone) {
            setError(""); // Clear any previous errors
          } else {
            // Keep processing state active
          }

          // Mettre à jour le statut UI
          const statusMessages: Record<string, string> = {
            EXTRACT_DATA_SCHEMA: "Analyzing document structure...",
            CREATE_ZIP_FILE: "Packaging documents securely...",
            GENERATE_ENCRYPTION_KEY: "Generating encryption keys...",
            ENCRYPT_FILE: "Encrypting documents...",
            UPLOAD_ENCRYPTED_FILE: "Uploading to secure storage...",
            DEPLOY_PROTECTED_DATA: "Deploying on blockchain...",
            PUSH_SECRET_TO_SMS: "Securing access keys...",
          };

          updateStatus(statusMessages[title] || title);
        },
      });

      console.log("✅ Protected Data Created:", {
        address: protectedData.address,
        txHash: protectedData.transactionHash,
        owner: protectedData.owner,
      });

      // 3. Configurer les permissions pour ton iExec app
      const appAddress = process.env.NEXT_PUBLIC_IEXEC_KYC_APP_ADDRESS;
      if (!appAddress) {
        throw new Error("iExec KYC app address not configured");
      }

      console.log("🔑 Granting access to iExec app...");

      const grantAccessResult = await dataProtectorCore.grantAccess({
        protectedData: protectedData.address,
        authorizedApp: appAddress,
        authorizedUser: "0x0000000000000000000000000000000000000000", // Public access
        pricePerAccess: 0, // Gratuit pour la démo
        numberOfAccess: 1, // Une seule utilisation

        onStatusUpdate: ({ title, isDone }) => {
          console.log(`🔐 Access Grant: ${title}`, { isDone });
          updateStatus(`Configuring access: ${title}`);
        },
      });

      console.log("✅ Access granted:", grantAccessResult);

      // 4. Sauvegarder les infos pour le processing
      setProtectedDataAddress(protectedData.address);

      // Clear any errors and update step
      setError("");
      updateStep(3);
      updateStatus("Protection complete! Ready for processing.");

      // 5. Rediriger vers la page de processing
      setTimeout(() => {
        router.push("/kyc/processing");
      }, 2000);
    } catch (error: unknown) {
      console.error("❌ DataProtector Error:", error);

      // Gestion des erreurs spécifiques
      let errorMessage = "Protection failed";

      if (error instanceof Error) {
        if (error.message?.includes("insufficient funds")) {
          errorMessage = "Insufficient xRLC tokens for transaction fees";
        } else if (error.message?.includes("network")) {
          errorMessage =
            "Network connection error - please check your connection to Bellecour sidechain";
        } else if (error.message?.includes("user rejected")) {
          errorMessage =
            "Transaction was rejected - please approve to continue";
        } else if (error.message?.includes("data size")) {
          errorMessage = "Documents too large - please reduce file sizes";
        } else {
          errorMessage = `Protection failed: ${error.message}`;
        }
      }

      setError(errorMessage);
      updateStatus("Protection failed");
    } finally {
      setProtecting(false);
    }
  };

  // Fonction helper pour mettre à jour le statut
  const updateStatus = (message: string) => {
    // Tu peux ajouter ça à ton state ou hook
    console.log(`📊 Status Update: ${message}`);
    // Optionnel: toast notification ou state update
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
