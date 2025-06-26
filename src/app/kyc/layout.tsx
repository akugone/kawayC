import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "KYC Verification | KawaiC",
  description:
    "Complete your confidential KYC verification process with iExec's secure enclave technology.",
};

export default function KYCLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
