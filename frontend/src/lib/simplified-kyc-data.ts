import { KYCDocument, SimpleKYCData } from "./kyc-types";

// Convert File to ArrayBuffer
export const fileToBuffer = (file: File): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onload = () => {
      resolve(reader.result as ArrayBuffer);
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
  });
};

// Convert File to base64 string
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
  });
};

// Prepare KYC data in the format expected by your iApp
export async function prepareSimpleKYCData(
  documents: Record<string, KYCDocument>
): Promise<SimpleKYCData> {
  console.log("📋 Preparing KYC data for iApp processing...");

  // Validate required documents
  const requiredTypes = ["selfie", "id", "addressProof"];
  for (const type of requiredTypes) {
    if (!documents[type]) {
      throw new Error(`Missing required document: ${type}`);
    }
  }

  try {
    // Convert all documents to base64 (matching your iApp's expected keys)
    const [selfieBase64, idBase64, addressProofBase64] = await Promise.all([
      fileToBase64(documents.selfie.file),
      fileToBase64(documents.id.file),
      fileToBase64(documents.addressProof.file),
    ]);

    const kycData: SimpleKYCData = {
      // These keys MUST match what your iApp expects in the deserializer.getValue() calls
      selfie: selfieBase64, // Your iApp: deserializer.getValue('selfie', Buffer)
      id: idBase64, // Your iApp: deserializer.getValue('id', Buffer)
      addressProof: addressProofBase64, // Your iApp: deserializer.getValue('addressProof', Buffer)

      metadata: {
        uploadedAt: Date.now(),
        userAddress: "", // Will be filled by the processing hook
        version: "0.0.1", // Matches your iApp version
      },
    };

    console.log("✅ KYC data prepared successfully:", {
      hasSelife: !!kycData.selfie,
      hasId: !!kycData.id,
      hasAddressProof: !!kycData.addressProof,
      selfieSize: kycData.selfie.length,
      idSize: kycData.id.length,
      addressProofSize: kycData.addressProof.length,
    });

    return kycData;
  } catch (error) {
    console.error("❌ Failed to prepare KYC data:", error);
    throw new Error(
      `Failed to prepare documents for processing: ${error.message}`
    );
  }
}

// Validate file types and sizes before processing
export function validateKYCDocuments(
  documents: Record<string, KYCDocument>
): void {
  const maxFileSize = 10 * 1024 * 1024; // 10MB per file
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  for (const [type, document] of Object.entries(documents)) {
    if (!document.file) {
      throw new Error(`Document ${type} is missing file data`);
    }

    if (document.file.size > maxFileSize) {
      throw new Error(`Document ${type} is too large (max 10MB)`);
    }

    if (!allowedTypes.includes(document.file.type)) {
      throw new Error(
        `Document ${type} has unsupported format. Please use JPEG, PNG, or WebP`
      );
    }
  }
}

// Estimate total processing time based on document sizes
export function estimateProcessingTime(
  documents: Record<string, KYCDocument>
): number {
  const totalSize = Object.values(documents).reduce(
    (sum, doc) => sum + doc.file.size,
    0
  );

  // Base processing time: 2 minutes
  // Additional time based on file sizes: 30 seconds per MB
  const baseTime = 120; // 2 minutes
  const sizeTime = Math.floor((totalSize / (1024 * 1024)) * 30);

  return Math.max(baseTime, baseTime + sizeTime);
}
