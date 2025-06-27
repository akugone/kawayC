"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoginGated } from "../../../components/auth/LoginGated";
import { DocumentUpload } from "../../../components/kyc/DocumentUpload";
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
  const [isProcessing, setIsProcessing] = useState(false);

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

    if (!canProcess || !iexecReady || isProcessing) {
      console.log("❌ Cannot process - conditions not met");
      return;
    }

    setIsProcessing(true);

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
      console.log("grant access:", res);

      console.log("✅ Access granted seamlessly to KYC app");
      startProcessing(protectedData.address);

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
          window.location.href = "/kyc/processing";
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
    } finally {
      setIsProcessing(false);
    }
  };

  // Extract button text logic
  const getButtonText = () => {
    if (isProcessing) return "🔄 Préparation en cours...";
    if (!canProcess) return "En attente de documents...";
    if (!iexecReady) return "Initializing iExec...";
    return "🚀 Passer à l'étape suivante";
  };

  // Compute the number of uploaded documents
  const uploadedCount = Object.keys(kycFlow.documents).length;
  let gifSrc = "/images/vide.gif";
  if (uploadedCount === 1) gifSrc = "/images/1_element.gif";
  if (uploadedCount === 2) gifSrc = "/images/2_elements.gif";
  if (uploadedCount === 3) gifSrc = "/images/complet.gif";

  return (
    <LoginGated requireSIWE={true}>
      <div
        className="min-h-screen flex items-center justify-center py-12"
        style={{ background: "#FAF7ED" }}
      >
        <div className="flex gap-16 bg-transparent" style={{ minWidth: 1400 }}>
          {/* Left: KYC Form */}
          <div
            className="flex-1 flex flex-col justify-center bg-white rounded-3xl border border-black p-[64px] min-w-[900px]"
            style={{ maxWidth: 1000 }}
          >
            <h2
              className="mb-12"
              style={{
                fontFamily: "Orbitron, sans-serif",
                fontSize: 32,
                fontWeight: 700,
              }}
            >
              Création de mon KYC
            </h2>
            <div className="flex gap-8 mb-12 justify-center">
              {/* Selfie */}
              <div className="flex flex-col items-start justify-start">
                <div
                  className="flex items-center mb-1 justify-between w-full"
                  style={{ fontFamily: "Manrope, sans-serif", fontSize: 16 }}
                >
                  <span className="text-s text-gray-700">Selfie</span>
                  <span className="ml-4 text-xs text-gray-500">
                    500 ko max.
                  </span>
                </div>
                <DocumentUpload
                  type="selfie"
                  document={kycFlow.documents.selfie}
                  onDocumentAdd={addDocument}
                  onDocumentRemove={removeDocument}
                  disabled={kycFlow.processing || isProcessing}
                />
              </div>
              {/* Pièce d'identité */}
              <div className="flex flex-col items-start justify-start">
                <div
                  className="flex items-center mb-1 justify-between w-full"
                  style={{ fontFamily: "Manrope, sans-serif", fontSize: 16 }}
                >
                  <span className="text-s text-gray-700">Pièce d'identité</span>
                  <span className="ml-4 text-xs text-gray-500">
                    500 ko max.
                  </span>
                </div>
                <DocumentUpload
                  type="id"
                  document={kycFlow.documents.id}
                  onDocumentAdd={addDocument}
                  onDocumentRemove={removeDocument}
                  disabled={kycFlow.processing || isProcessing}
                />
              </div>
              {/* Justificatif */}
              <div className="flex flex-col items-start justify-start">
                <div
                  className="flex items-center mb-1 justify-between w-full"
                  style={{ fontFamily: "Manrope, sans-serif", fontSize: 16 }}
                >
                  <span className="text-s text-gray-700">Justificatif</span>
                  <span className="ml-4 text-xs text-gray-500">
                    500 ko max.
                  </span>
                </div>
                <DocumentUpload
                  type="addressProof"
                  document={kycFlow.documents.addressProof}
                  onDocumentAdd={addDocument}
                  onDocumentRemove={removeDocument}
                  disabled={kycFlow.processing || isProcessing}
                />
              </div>
            </div>
            {/* Button with loading state */}
            <button
              onClick={handleProtectAndProcess}
              disabled={!canProcess || !iexecReady || isProcessing}
              style={{
                background: "#FFE66C",
                borderRadius: 8,
                borderTop: "1px solid #000",
                borderRight: "2px solid #000",
                borderBottom: "3px solid #000",
                borderLeft: "1px solid #000",
                fontFamily: "Orbitron, sans-serif",
                fontSize: 20,
                padding: "20px 24px",
                marginTop: 16,
                width: "100%",
                textAlign: "center",
                opacity: !canProcess || !iexecReady || isProcessing ? 0.5 : 1,
                fontWeight: 500,
                boxSizing: "border-box",
                cursor:
                  !canProcess || !iexecReady || isProcessing
                    ? "not-allowed"
                    : "pointer",
                transition: "opacity 0.2s",
                position: "relative",
              }}
            >
              {isProcessing && (
                <div
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <div
                    style={{
                      width: "20px",
                      height: "20px",
                      border: "2px solid #000",
                      borderTop: "2px solid transparent",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite",
                    }}
                  />
                  <span style={{ fontSize: "16px" }}>
                    Préparation en cours...
                  </span>
                </div>
              )}
              <span style={{ visibility: isProcessing ? "hidden" : "visible" }}>
                {getButtonText()}
              </span>
            </button>
          </div>
          {/* Right: Bubble Tea Cup */}
          <div
            className="flex flex-col items-center justify-center bg-white rounded-3xl border border-black p-[64px] min-w-[360px]"
            style={{ maxWidth: 360 }}
          >
            <img
              src={gifSrc}
              alt="Bubble Tea Cup"
              className="mb-8"
              style={{ width: 220, height: 220 }}
            />
            <h4
              className="mb-2 text-center"
              style={{
                fontFamily: "Orbitron, sans-serif",
                fontSize: 20,
                fontWeight: 700,
              }}
            >
              Composez-moi !
            </h4>
            <p
              className="text-gray-500 text-center"
              style={{ fontFamily: "Manrope, sans-serif", fontSize: 16 }}
            >
              Chaque fichier que tu ajoutes me donne des forces !
            </p>
          </div>
        </div>
      </div>

      {/* Add CSS for spinner animation */}
      <style jsx>{`
        @keyframes spin {
          0% {
            transform: translate(-50%, -50%) rotate(0deg);
          }
          100% {
            transform: translate(-50%, -50%) rotate(360deg);
          }
        }
      `}</style>
    </LoginGated>
  );
}
