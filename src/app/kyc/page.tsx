"use client";

import { Button } from "@/components/ui/button";
import { DebugSection } from "@/components/ui/debug-section";
import { useKycFlow } from "@/hooks/useKycFlow";
import {
  CheckCircle,
  Circle,
  Clock,
  FileText,
  Shield,
  Wallet,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAccount } from "wagmi";

export default function KYCDashboard() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const { kycFlow, getStepsWithStatus, updateStep } = useKycFlow();

  useEffect(() => {
    if (!isConnected) {
      router.push("/");
      return;
    }

    // Update step 1 as completed when wallet is connected
    if (kycFlow.currentStep === 1) {
      updateStep(2);
    }
  }, [isConnected, router, kycFlow.currentStep, updateStep]);

  // Update page title based on current step
  useEffect(() => {
    const stepTitles = {
      1: "Connect Wallet | KYC Verification",
      2: "Upload Documents | KYC Verification",
      3: "Processing | KYC Verification",
      4: "Results | KYC Verification",
    };

    const title =
      stepTitles[kycFlow.currentStep as keyof typeof stepTitles] ||
      "KYC Verification";
    document.title = title;
  }, [kycFlow.currentStep]);

  const steps = getStepsWithStatus();

  const handleContinue = () => {
    switch (kycFlow.currentStep) {
      case 2:
        router.push("/kyc/upload");
        break;
      case 3:
        router.push("/kyc/processing");
        break;
      case 4:
        router.push("/kyc/result");
        break;
      default:
        break;
    }
  };

  const getStepIcon = (step: any) => {
    if (step.completed) {
      return <CheckCircle className="w-6 h-6 text-green-500" />;
    } else if (step.current) {
      return <Clock className="w-6 h-6 text-blue-500" />;
    } else {
      return <Circle className="w-6 h-6 text-gray-300" />;
    }
  };

  const getFeatureIcon = (feature: string) => {
    switch (feature) {
      case "confidential":
        return <Shield className="w-8 h-8 text-blue-500" />;
      case "documents":
        return <FileText className="w-8 h-8 text-green-500" />;
      case "wallet":
        return <Wallet className="w-8 h-8 text-purple-500" />;
      default:
        return null;
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Connecting to wallet...</h1>
          <p className="text-gray-600">
            Please wait while we verify your connection.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">
          Confidential KYC Verification
        </h1>
        <p className="text-xl text-gray-600 mb-2">
          Verify your identity while keeping your documents private
        </p>
        <p className="text-sm text-gray-500">
          Powered by iExec Confidential Computing
        </p>
      </div>

      {/* Features Highlight */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <div className="text-center p-6 bg-gray-50 rounded-lg">
          {getFeatureIcon("confidential")}
          <h3 className="font-semibold mt-4 mb-2">100% Confidential</h3>
          <p className="text-sm text-gray-600">
            Your documents are processed in a secure enclave and never exposed
          </p>
        </div>
        <div className="text-center p-6 bg-gray-50 rounded-lg">
          {getFeatureIcon("documents")}
          <h3 className="font-semibold mt-4 mb-2">Smart Verification</h3>
          <p className="text-sm text-gray-600">
            AI-powered document analysis validates your identity automatically
          </p>
        </div>
        <div className="text-center p-6 bg-gray-50 rounded-lg">
          {getFeatureIcon("wallet")}
          <h3 className="font-semibold mt-4 mb-2">Mobile Wallet</h3>
          <p className="text-sm text-gray-600">
            Get a digital ID card you can add to Apple Wallet or Google Pay
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white border rounded-lg p-8 mb-8">
        <h2 className="text-2xl font-semibold mb-6">Verification Progress</h2>

        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center space-x-4">
              {getStepIcon(step)}
              <div className="flex-1">
                <h3
                  className={`font-medium ${
                    step.current
                      ? "text-blue-600"
                      : step.completed
                      ? "text-green-600"
                      : "text-gray-500"
                  }`}
                >
                  {step.title}
                </h3>
                <p className="text-sm text-gray-500">{step.description}</p>
              </div>
              {step.current && (
                <Button onClick={handleContinue} size="sm">
                  Continue
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Current Status */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-800 mb-2">Current Status</h3>
        {kycFlow.processing && (
          <p className="text-blue-700">
            🔄 Your documents are being processed securely in the iExec
            network...
          </p>
        )}
        {kycFlow.error && (
          <p className="text-red-700">❌ Error: {kycFlow.error}</p>
        )}
        {!kycFlow.processing && !kycFlow.error && (
          <p className="text-blue-700">
            Ready to proceed with{" "}
            {steps.find((s) => s.current)?.title.toLowerCase()}
          </p>
        )}
      </div>

      {/* Debug Info */}
      <DebugSection data={kycFlow} />
    </div>
  );
}
