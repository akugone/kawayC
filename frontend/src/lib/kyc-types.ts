export interface KYCDocument {
  type: "selfie" | "id" | "addressProof";
  file: File;
  buffer: Buffer;
  preview: string;
  encrypted?: string;
}

export interface KYCStep {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  current: boolean;
}

export interface KYCFlow {
  currentStep: number;
  documents: {
    selfie?: KYCDocument;
    id?: KYCDocument;
    addressProof?: KYCDocument;
  };
  protectedDataAddress?: string;
  taskId?: string;
  processing: boolean;
  results?: KYCResults;
  error?: string;
}

export interface KYCResults {
  ageValidated: boolean;
  countryResidence: string;
  kycStatus: "valid" | "invalid" | "pending";
  timestamp: number;
  signature?: string;
}

export interface WalletPass {
  qrCode: string;
  passUrl: string;
  appleWalletUrl?: string;
  googleWalletUrl?: string;
  metadata: {
    ageVerified: boolean;
    country: string;
    issueDate: string;
    expiryDate: string;
  };
}

export const KYC_STEPS: KYCStep[] = [
  {
    id: 1,
    title: "Connect Wallet",
    description: "Connect your wallet to start KYC process",
    completed: false,
    current: true,
  },
  {
    id: 2,
    title: "Upload Documents",
    description: "Upload selfie, ID card and proof of residence",
    completed: false,
    current: false,
  },
  {
    id: 3,
    title: "Confidential Processing",
    description: "AI processing in secure environment",
    completed: false,
    current: false,
  },
  {
    id: 4,
    title: "Generate Wallet Card",
    description: "Create your digital identity card",
    completed: false,
    current: false,
  },
];

export const DOCUMENT_TYPES = {
  selfie: {
    label: "Selfie Photo",
    accept: "image/*",
    description: "Take a clear photo of your face",
  },
  id: {
    label: "ID Card",
    accept: "image/*,application/pdf",
    description: "Front and back of your ID card",
  },
  addressProof: {
    label: "Proof of Residence",
    accept: "image/*,application/pdf",
    description: "Utility bill or bank statement (last 3 months)",
  },
} as const;
