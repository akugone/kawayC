"use client";

import { Button } from "@/components/ui/button";
import { DebugSection } from "@/components/ui/debug-section";
import { useIexecKYCTask } from "@/hooks/useIexecKYCTask";
import { useSimpleKycFlow } from "@/hooks/useSimpleKycFlow";
import { IExecDataProtectorCore } from "@iexec/dataprotector";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Clock,
  Cpu,
  RefreshCw,
  Shield,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

export default function KYCProcessingPage() {
  const router = useRouter();
  const { isConnected, address } = useAccount();
  const {
    kycFlow,
    updateStatus,
    setTaskId,
    completeProcessing,
    setError,
    reset: resetKycFlow,
  } = useSimpleKycFlow();

  const [dataProtectorCore, setDataProtectorCore] =
    useState<IExecDataProtectorCore | null>(null);

  // Use real iExec KYC task hook
  const {
    taskStatus,
    results,
    isProcessing,
    isCompleted,
    isFailed,
    duration,
    startKYCProcessing,
    reset: resetTask,
  } = useIexecKYCTask(dataProtectorCore);

  // Initialize DataProtector
  useEffect(() => {
    if (!isConnected) {
      router.push("/");
      return;
    }

    const initializeDataProtector = async () => {
      if (isConnected && address) {
        try {
          const { IExecDataProtector } = await import("@iexec/dataprotector");
          // For now, we'll use a mock provider since we need the real one
          // In production, you'd get this from the wallet connector
          const mockProvider = {
            request: async () => {},
            on: () => {},
            removeListener: () => {},
          };
          const dataProtector = new IExecDataProtector(mockProvider as any);
          setDataProtectorCore(dataProtector.core);
        } catch (error) {
          console.error("Failed to initialize DataProtector:", error);
          setError("Failed to initialize secure connection");
        }
      }
    };
    initializeDataProtector();
  }, [isConnected, address, router, setError]);

  // Check prerequisites
  useEffect(() => {
    console.log("🔍 Processing page - checking prerequisites");
    console.log("📊 Current state:", {
      isConnected,
      protectedDataAddress: kycFlow.protectedDataAddress,
      processing: kycFlow.processing,
      taskStatus: taskStatus.status,
    });

    if (!isConnected) {
      console.log("❌ Not connected, redirecting to home");
      router.push("/");
      return;
    }

    if (!kycFlow.protectedDataAddress) {
      console.log("❌ No protected data address found, redirecting to upload");
      router.push("/kyc/upload");
    } else {
      console.log(
        "✅ Protected data address found:",
        kycFlow.protectedDataAddress
      );
    }
  }, [isConnected, router, kycFlow.protectedDataAddress]);

  // Auto-start processing
  useEffect(() => {
    console.log("🔍 Auto-start processing effect triggered");
    console.log("📊 Conditions:", {
      hasProtectedData: !!kycFlow.protectedDataAddress,
      hasAddress: !!address,
      taskStatus: taskStatus.status,
    });

    if (
      kycFlow.protectedDataAddress &&
      address &&
      taskStatus.status === "IDLE"
    ) {
      console.log("🚀 Auto-starting KYC processing...");
      startProcessing();
    } else {
      console.log("⏸️ Auto-start conditions not met");
    }
  }, [kycFlow.protectedDataAddress, address, taskStatus.status]);

  // Sync task status with KYC flow
  useEffect(() => {
    updateStatus(taskStatus.message);
    if (taskStatus.taskId) {
      setTaskId(taskStatus.taskId);
    }
  }, [taskStatus, updateStatus, setTaskId]);

  // Handle completion
  useEffect(() => {
    if (results) {
      console.log("✅ Processing completed, setting results:", results);
      completeProcessing(results);

      // Auto-redirect to results after 3 seconds
      setTimeout(() => {
        router.push("/kyc/result");
      }, 3000);
    }
  }, [results, completeProcessing, router]);

  // Main processing function
  const startProcessing = async () => {
    if (!kycFlow.protectedDataAddress || !address) {
      setError("Missing required data for processing");
      return;
    }

    try {
      console.log("🚀 Starting iExec KYC processing workflow...");
      console.log("📊 Protected Data:", kycFlow.protectedDataAddress);

      await startKYCProcessing({
        protectedDataAddress: kycFlow.protectedDataAddress,
        userAddress: address,
        maxPrice: 1000, // 1000 nRLC
        tag: ["kyc", "confidential"],
      });

      console.log("🎉 Processing workflow completed!");
    } catch (error: any) {
      console.error("❌ Processing failed:", error);
      setError(`Processing failed: ${error.message}`);
    }
  };

  const handleReset = () => {
    // Clear localStorage
    localStorage.removeItem("kyc-flow-state");
    // Reset both flows
    resetKycFlow();
    resetTask();
    // Redirect to upload page
    router.push("/kyc/upload");
  };

  const getStatusIcon = () => {
    switch (taskStatus.status) {
      case "IDLE":
        return <Clock className="w-12 h-12 text-gray-500" />;
      case "TRIGGERING":
        return <Shield className="w-12 h-12 text-yellow-500" />;
      case "RUNNING":
        return (
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
        );
      case "COMPLETED":
        return <CheckCircle className="w-12 h-12 text-green-500" />;
      case "FAILED":
        return <AlertCircle className="w-12 h-12 text-red-500" />;
    }
  };

  const getStatusColor = () => {
    switch (taskStatus.status) {
      case "TRIGGERING":
        return "text-yellow-600";
      case "RUNNING":
        return "text-blue-600";
      case "COMPLETED":
        return "text-green-600";
      case "FAILED":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const formatDuration = (seconds: number) => {
    return seconds > 60
      ? `${Math.floor(seconds / 60)}m ${seconds % 60}s`
      : `${seconds}s`;
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Wallet not connected</h1>
          <Button onClick={() => router.push("/")}>Connect Wallet</Button>
        </div>
      </div>
    );
  }

  // Check if we have the required data to process
  if (!kycFlow.protectedDataAddress) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">No Processing Data Found</h1>
          <p className="text-gray-600 mb-6">
            It looks like you don't have any documents ready for processing.
            Please upload your documents first.
          </p>
          <div className="space-y-3">
            <Button
              onClick={() => router.push("/kyc/upload")}
              className="w-full"
            >
              Upload Documents
            </Button>
            <Button
              onClick={() => router.push("/kyc")}
              variant="outline"
              className="w-full"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push("/kyc")}
          disabled={isProcessing}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="text-center">
          <h1 className="text-3xl font-bold">Confidential Processing</h1>
          <p className="text-gray-600">AI verification in secure enclave</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
          disabled={isProcessing}
          className="text-red-600 border-red-300 hover:bg-red-50"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Reset
        </Button>
      </div>

      {/* Main Status Card */}
      <div className="bg-white border rounded-lg p-8 mb-8 text-center">
        {getStatusIcon()}

        <h2 className={`text-2xl font-semibold mt-4 mb-2 ${getStatusColor()}`}>
          {taskStatus.message}
        </h2>

        <p className="text-gray-600 mb-4">
          Duration: {formatDuration(duration)}
        </p>

        {taskStatus.taskId && (
          <p className="text-xs text-gray-400 mb-6">
            Task ID: {taskStatus.taskId}
          </p>
        )}

        {/* Progress Bar */}
        {isProcessing && (
          <div className="mb-6">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${taskStatus.progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {taskStatus.progress}% complete
            </p>
          </div>
        )}

        {/* Results Preview */}
        {results && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-green-800 mb-2">
              ✅ Verification Results
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-green-600">Age Validated:</span>
                <span className="ml-2 font-medium">
                  {results.ageValidated ? "✅ 18+" : "❌ Not verified"}
                </span>
              </div>
              <div>
                <span className="text-green-600">Country:</span>
                <span className="ml-2 font-medium">
                  {results.countryResidence}
                </span>
              </div>
              <div>
                <span className="text-green-600">Status:</span>
                <span className="ml-2 font-medium capitalize">
                  {results.kycStatus}
                </span>
              </div>
              <div>
                <span className="text-green-600">Verified:</span>
                <span className="ml-2 font-medium">
                  {new Date(results.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        {isCompleted && results && (
          <Button onClick={() => router.push("/kyc/result")} size="lg">
            <CheckCircle className="w-4 h-4 mr-2" />
            Generate Digital ID Card
          </Button>
        )}

        {isFailed && (
          <div className="space-y-4">
            <div className="text-red-600">{kycFlow.error}</div>
            <div className="space-x-4">
              <Button
                onClick={() => {
                  resetTask();
                  router.push("/kyc/upload");
                }}
                variant="outline"
              >
                Try Again
              </Button>
              <Button onClick={() => router.push("/kyc")} variant="ghost">
                Start Over
              </Button>
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="text-gray-600 text-sm">
            <p>⏳ Please wait while your documents are being processed...</p>
            <p className="text-xs mt-1">
              Real processing typically takes 2-5 minutes
            </p>
          </div>
        )}
      </div>

      {/* Processing Info */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
          <Shield className="w-6 h-6 text-blue-500 mt-1" />
          <div>
            <h3 className="font-semibold text-blue-800">Secure Processing</h3>
            <p className="text-blue-700 text-sm mt-1">
              Your documents are processed in Intel SGX/TDX secure enclaves
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-3 p-4 bg-green-50 rounded-lg">
          <Cpu className="w-6 h-6 text-green-500 mt-1" />
          <div>
            <h3 className="font-semibold text-green-800">AI Verification</h3>
            <p className="text-green-700 text-sm mt-1">
              Advanced AI analyzes documents and validates age/identity
            </p>
          </div>
        </div>
      </div>

      {/* Debug Info */}
      <DebugSection
        data={{
          protectedData: kycFlow.protectedDataAddress,
          taskId: taskStatus.taskId,
          status: taskStatus.status,
          progress: taskStatus.progress,
          duration: formatDuration(duration),
          results: results ? "Generated" : "Not yet",
          workflow: "Upload → Protect → Grant → Process → Results",
        }}
      />
    </div>
  );
}
