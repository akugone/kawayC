export interface KYCDocument {
  type: "selfie" | "id" | "addressProof"; // Matches your iApp's expected protected data keys
  file: File;
  preview: string;
  buffer?: ArrayBuffer; // For processing
  uploaded?: boolean;
}

// Document type configurations
export const DOCUMENT_TYPES = {
  selfie: {
    label: "Selfie Photo",
    description: "Upload a clear photo of your face",
    accept: "image/*",
  },
  id: {
    label: "Identity Document",
    description: "Upload your ID card, passport, or driver's license",
    accept: "image/*,.pdf",
  },
  addressProof: {
    label: "Proof of Address",
    description:
      "Upload a recent utility bill, bank statement, or rental agreement",
    accept: "image/*,.pdf",
  },
} as const;

export interface KYCResults {
  // Core verification results (standardized for frontend)
  ageValidated: boolean; // Mapped from your iApp's ageMatch
  countryResidence: string; // Inferred as "France" for your French document processor
  kycStatus: "valid" | "failed" | "pending" | "rejected"; // Mapped from your iApp's overall
  timestamp: number;
  signature: string;

  // Direct fields from your iApp output (result.txt)
  faceMatchScore?: number; // Direct from your iApp: faceMatchScore
  faceValid?: boolean; // Direct from your iApp: faceValid
  overallValidation?: boolean; // Direct from your iApp: overall

  // Additional processing details (not in your current iApp but could be added)
  estimatedAge?: number; // Your iApp calculates this internally
  idName?: string; // Your iApp extracts this
  billName?: string; // Your iApp extracts this
  nameMatch?: boolean; // Your iApp validates this

  // Error handling
  error?: string;
  warnings?: string[];

  // iExec specific
  taskId?: string;
  appVersion?: string;
  processingNode?: string;
}

export interface KYCFlow {
  currentStep: number;
  documents: Record<string, KYCDocument>;
  processing: boolean;
  protectedDataAddress?: string;
  taskId?: string;
  results?: KYCResults;
  error?: string;
  statusMessage?: string;
}

export const KYC_STEPS = [
  {
    id: 1,
    title: "Connect Wallet",
    description: "Securely connect your Web3 wallet",
    icon: "wallet",
  },
  {
    id: 2,
    title: "Upload Documents",
    description: "Upload selfie, ID, and proof of address",
    icon: "upload",
  },
  {
    id: 3,
    title: "Processing",
    description: "AI verification in secure enclave",
    icon: "process",
  },
  {
    id: 4,
    title: "Results",
    description: "Generate your digital identity wallet pass",
    icon: "result",
  },
];

// Wallet Pass Types
export interface WalletPass {
  passUrl: string;
  appleWalletUrl?: string;
  googleWalletUrl?: string;
  qrCode: string;
  expiryDate: Date;
  passData: {
    name: string;
    description: string;
    organization: string;
    logoUrl?: string;
    backgroundColor?: string;
    foregroundColor?: string;
    fields: {
      label: string;
      value: string;
      textAlignment?: "left" | "center" | "right";
    }[];
  };
}

// iExec Task Status Types
export interface IExecTaskStatus {
  status: "IDLE" | "TRIGGERING" | "RUNNING" | "COMPLETED" | "FAILED";
  progress: number;
  message: string;
  logs: string[];
  taskId?: string;
  startTime?: number;
  endTime?: number;
}

// Processing Parameters
export interface ProcessingParams {
  protectedDataAddress: string;
  userAddress: string;
  maxPrice?: number;
  tag?: string[];
}

// Simple KYC Data Format (for DataProtector) - Matches your iApp's expected keys
export interface SimpleKYCData {
  selfie: Buffer; // base64 - your iApp expects this key
  id: Buffer; // base64 - your iApp expects this key
  addressProof: Buffer; // base64 - your iApp expects this key (used as 'billBuffer' internally)
}

// Your iApp's raw output format (from result.txt)
export interface RawKYCAppResult {
  faceMatchScore: number; // Cosine similarity score from face matching
  faceValid: boolean; // Whether face match score > 0.65
  ageMatch: boolean; // Whether estimated age matches ID age (within 6 years)
  overall: boolean; // Overall validation result (nameMatch && ageMatch && faceValid)
}

// Internal validation result from your iApp's crossValidate function
export interface ValidationResult {
  nameMatch: boolean; // Whether names match between ID and address proof
  ageMatch: boolean; // Whether estimated age matches ID age
  overall: boolean; // nameMatch && ageMatch
}
