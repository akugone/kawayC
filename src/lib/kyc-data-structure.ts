import { KYCDocument } from "./kyc-types";

// Simplified KYC data structure - just the three binary files
// Example of the data structure:
// {
//   selfie: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
//   id: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
//   addressProof: "data:application/pdf;base64,JVBERi0xLjQKJcOkw7zDtsO..."
// }
export interface SimpleKYCData {
  selfie: string; // base64 encoded binary data
  id: string; // base64 encoded binary data
  addressProof: string; // base64 encoded binary data
  [key: string]: string; // Index signature for DataProtector compatibility
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
    selfie: documents.selfie.base64,
    id: documents.id.base64,
    addressProof: documents.addressProof.base64,
  };
}
