import { KYCDocument } from "./kyc-types";

// Simplified KYC data structure - just the three binary files
// Example of the data structure:
// {
//   selfie: Buffer containing binary image data,
//   id: Buffer containing binary document data,
//   addressProof: Buffer containing binary document data
// }
export interface SimpleKYCData {
  selfie: Buffer; // binary image data
  id: Buffer; // binary document data
  addressProof: Buffer; // binary document data
  [key: string]: Buffer; // Index signature for DataProtector compatibility
}

// Simplified KYC data preparation
export async function prepareSimpleKYCData(documents: {
  selfie?: KYCDocument;
  id?: KYCDocument;
  addressProof?: KYCDocument;
}): Promise<SimpleKYCData> {
  if (!documents.selfie || !documents.id || !documents.addressProof) {
    throw new Error("All three documents are required");
  }

  return {
    selfie: documents.selfie.buffer,
    id: documents.id.buffer,
    addressProof: documents.addressProof.buffer,
  };
}
