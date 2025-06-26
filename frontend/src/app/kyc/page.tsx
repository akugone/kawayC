"use client";

import {
  CheckCircle,
  Circle,
  Clock,
  FileText,
  RefreshCw,
  Shield,
  Wallet,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { LoginGated } from "../../components/auth/LoginGated";
import { Button } from "../../components/ui/button";
import { DebugSection } from "../../components/ui/debug-section";
import { useKycFlow } from "../../hooks/useKycFlow";

export default function KYCDashboard() {
  const router = useRouter();
  const { kycFlow, getStepsWithStatus, updateStep, resetFlow } = useKycFlow();

  useEffect(() => {
    // Update step 1 as completed when wallet is connected
    if (kycFlow.currentStep === 1) {
      updateStep(2);
    }
  }, [kycFlow.currentStep, updateStep]);

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

  const handleReset = () => {
    // Clear localStorage
    localStorage.removeItem("kyc-flow-state");
    // Reset the flow
    resetFlow();
    // Reload the page to ensure clean state
    window.location.reload();
  };

  const getStepIcon = (step: { completed: boolean; current: boolean }) => {
    if (step.completed) {
      return <CheckCircle className="w-6 h-6 text-green-500" />;
    } else if (step.current) {
      return <Clock className="w-6 h-6 text-blue-500" />;
    } else {
      return <Circle className="w-6 h-6 text-gray-300" />;
    }
  };

  const getStepTitleClass = (step: {
    current: boolean;
    completed: boolean;
  }) => {
    if (step.current) {
      return "text-blue-600";
    } else if (step.completed) {
      return "text-green-600";
    } else {
      return "text-gray-500";
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

  return (
    <LoginGated requireSIWE={true}>
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
            {steps.map((step) => (
              <div key={step.id} className="flex items-center space-x-4">
                {getStepIcon(step)}
                <div className="flex-1">
                  <h3 className={`font-medium ${getStepTitleClass(step)}`}>
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
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-blue-800">Current Status</h3>
            {(kycFlow.processing ||
              kycFlow.results ||
              Object.keys(kycFlow.documents).length > 0) && (
              <Button
                onClick={handleReset}
                variant="outline"
                size="sm"
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset Session
              </Button>
            )}
          </div>
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
    </LoginGated>
  );
}
