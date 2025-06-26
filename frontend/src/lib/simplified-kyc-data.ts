export interface SimpleKYCData {
  selfie: Buffer; // binary image data
  id: Buffer; // binary document data
  addressProof: Buffer; // binary document data
  [key: string]: Buffer; // Index signature for DataProtector compatibility
}

export interface KYCDocument {
  type: "selfie" | "id" | "addressProof";
  file: File;
  buffer: Buffer; // This is what we'll use directly
  preview: string; // For UI preview only
}

// Convert files to the simplified format DataProtector expects
export async function prepareSimpleKYCData(documents: {
  selfie?: KYCDocument;
  id?: KYCDocument;
  addressProof?: KYCDocument;
}): Promise<SimpleKYCData> {
  if (!documents.selfie || !documents.id || !documents.addressProof) {
    throw new Error(
      "All three documents (selfie, id, addressProof) are required"
    );
  }

  // Return the exact format iExec DataProtector expects
  return {
    selfie: documents.selfie.buffer,
    id: documents.id.buffer,
    addressProof: documents.addressProof.buffer,
  };
}

// Helper to convert File to Buffer (used in DocumentUpload component)
export function fileToBuffer(file: File): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as ArrayBuffer;
      const buffer = Buffer.from(result);
      resolve(buffer);
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

// KYC Results format (what comes back from iExec app)
export interface KYCResults {
  ageValidated: boolean;
  countryResidence: string;
  kycStatus: "valid" | "invalid" | "pending";
  timestamp: number;
  signature?: string;
}
