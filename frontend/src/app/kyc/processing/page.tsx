"use client";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Clock,
  Cpu,
  RefreshCw,
  Shield,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { LoginGated } from "../../../components/auth/LoginGated";
import { Button } from "../../../components/ui/button";
import { DebugSection } from "../../../components/ui/debug-section";
import { useIexecKYCTask } from "../../../hooks/useIexecKYCTask";
import { useIexecWithSIWE } from "../../../hooks/useIexecWithSIWE";
import { useSimpleKycFlow } from "../../../hooks/useSimpleKycFlow";

export default function KYCProcessingPage() {
  const router = useRouter();
  const { address } = useAccount();
  const [isLoading, setIsLoading] = useState(true);

  const {
    kycFlow,
    updateStatus,
    setTaskId,
    completeProcessing,
    setError,
    reset: resetKycFlow,
  } = useSimpleKycFlow();

  // Use the new SIWE-enabled iExec hook
  const { isReady: iexecReady } = useIexecWithSIWE();

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
  } = useIexecKYCTask();

  // Check prerequisites with improved state loading
  useEffect(() => {
    console.log("🔍 Processing page - checking prerequisites");
    console.log("📊 Current state:", {
      iexecReady,
      protectedDataAddress: kycFlow.protectedDataAddress,
      processing: kycFlow.processing,
      taskStatus: taskStatus.status,
    });

    // Give time for state to load before redirecting
    const timeoutId = setTimeout(() => {
      if (!kycFlow.protectedDataAddress && !kycFlow.processing) {
        console.log(
          "❌ No protected data address found after timeout, redirecting to upload"
        );
        router.push("/kyc/upload");
      } else {
        console.log(
          "✅ Protected data address found:",
          kycFlow.protectedDataAddress
        );
        setIsLoading(false);
      }
    }, 2000);

    // Clear timeout if we find the data quickly
    if (kycFlow.protectedDataAddress) {
      clearTimeout(timeoutId);
      console.log(
        "✅ Protected data address found immediately:",
        kycFlow.protectedDataAddress
      );
      setIsLoading(false);
    }

    return () => clearTimeout(timeoutId);
  }, [
    router,
    kycFlow.protectedDataAddress,
    kycFlow.processing,
    taskStatus.status,
    iexecReady,
  ]);

  // Auto-start real iExec processing
  useEffect(() => {
    console.log("🔍 Auto-start processing effect triggered");
    console.log("📊 Conditions:", {
      hasProtectedData: !!kycFlow.protectedDataAddress,
      hasAddress: !!address,
      iexecReady,
      taskStatus: taskStatus.status,
      hasTaskId: !!taskStatus.taskId,
      isProcessing,
    });

    if (
      kycFlow.protectedDataAddress &&
      address &&
      iexecReady &&
      !taskStatus.taskId &&
      !isProcessing &&
      taskStatus.status !== "FAILED"
    ) {
      console.log("🚀 All conditions met, starting real iExec processing...");

      startKYCProcessing({
        protectedDataAddress: kycFlow.protectedDataAddress,
        userAddress: address,
        maxPrice: 1000, // 1000 nRLC
      }).catch((error) => {
        console.error("❌ iExec processing failed:", error);
        setError(`Processing failed: ${error.message}`);
      });
    } else {
      console.log("⏸️ Auto-start conditions not met:", {
        hasProtectedData: !!kycFlow.protectedDataAddress,
        hasAddress: !!address,
        iexecReady,
        noTaskId: !taskStatus.taskId,
        notProcessing: !isProcessing,
        notFailed: taskStatus.status !== "FAILED",
      });
    }
  }, [
    kycFlow.protectedDataAddress,
    address,
    iexecReady,
    taskStatus.taskId,
    taskStatus.status,
    isProcessing,
    startKYCProcessing,
    setError,
  ]);

  // Sync task status with KYC flow
  useEffect(() => {
    updateStatus(taskStatus.message);
    if (taskStatus.taskId) {
      setTaskId(taskStatus.taskId);
    }
  }, [taskStatus, updateStatus, setTaskId]);

  // Handle completion - NO AUTO-REDIRECT
  useEffect(() => {
    if (results) {
      console.log(
        "✅ Real iExec processing completed, setting results:",
        results
      );
      completeProcessing(results);
      // User manually controls navigation to results
    }
  }, [results, completeProcessing]);

  // Manual navigation functions
  const goToResults = async () => {
    console.log("🚀 Manual navigation to results initiated");

    if (results) {
      console.log("✅ Results confirmed before navigation:", results);

      // Ensure state is saved
      completeProcessing(results);

      // Use window.location for reliable navigation
      setTimeout(() => {
        window.location.href = "/kyc/result";
      }, 100);
    } else {
      console.error("❌ No results available for navigation");
    }
  };

  const goBack = () => {
    console.log("⬅️ Manual back navigation");
    router.push("/kyc/upload");
  };

  const handleReset = () => {
    console.log("🔄 Resetting processing state");
    localStorage.removeItem("kyc-flow-state");
    resetKycFlow();
    resetTask();
    router.push("/kyc/upload");
  };

  const getStatusIcon = () => {
    switch (taskStatus.status) {
      case "IDLE":
        return <Clock className="w-12 h-12 text-gray-500" />;
      case "TRIGGERING":
        return <Shield className="w-12 h-12 text-yellow-500 animate-pulse" />;
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
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  // Loading state while checking for protected data
  if (isLoading) {
    return (
      <LoginGated requireSIWE={true}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold mb-4">
              Loading Processing Data...
            </h1>
            <p className="text-gray-600">Retrieving your protected documents</p>
          </div>
        </div>
      </LoginGated>
    );
  }

  // Check if we have the required data to process
  if (!kycFlow.protectedDataAddress) {
    return (
      <LoginGated requireSIWE={true}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center max-w-md mx-4">
            <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-4">
              No Processing Data Found
            </h1>
            <p className="text-gray-600 mb-6">
              It looks like you don't have any documents ready for processing.
              Please upload your documents first.
            </p>
            <Button onClick={() => router.push("/kyc/upload")} className="mr-2">
              Upload Documents
            </Button>
          </div>
        </div>
      </LoginGated>
    );
  }

  return (
    <LoginGated requireSIWE={true}>
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={() => router.push("/kyc/upload")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="text-center">
            <h1 className="text-3xl font-bold">Document Processing</h1>
            <p className="text-gray-600">
              iExec confidential verification in progress
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="text-red-600 border-red-300 hover:bg-red-50"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>

        {/* Processing Status Display */}
        <div className="text-center mb-8">
          <div className="mb-6">{getStatusIcon()}</div>
          <h2 className={`text-3xl font-bold mb-4 ${getStatusColor()}`}>
            {taskStatus.message}
          </h2>
          <div className="space-y-2">
            <div className="text-gray-600">
              Status: <span className="font-medium">{taskStatus.status}</span>
            </div>
            {taskStatus.taskId && (
              <div className="text-gray-600 text-sm">
                Task ID:{" "}
                <span className="font-mono">
                  {taskStatus.taskId.slice(0, 20)}...
                </span>
              </div>
            )}
            {duration > 0 && (
              <div className="text-gray-600">
                Duration:{" "}
                <span className="font-medium">{formatDuration(duration)}</span>
              </div>
            )}
            {taskStatus.progress > 0 && (
              <div className="w-full max-w-md mx-auto mt-4">
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${taskStatus.progress}%` }}
                  ></div>
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {taskStatus.progress}%
                </div>
              </div>
            )}
          </div>

          {/* Manual Controls When Completed */}
          {isCompleted && results && (
            <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-green-800 mb-2">
                🎉 Verification Complete!
              </h3>
              <p className="text-green-700 mb-4">
                Your documents have been successfully verified by the iExec KYC
                app.
              </p>

              {/* Show results summary */}
              <div className="bg-white p-4 rounded border mb-6">
                <h4 className="font-semibold mb-2">Verification Results:</h4>
                <div className="text-sm space-y-1">
                  <div>
                    ✅ Age Validated: {results.ageValidated ? "Yes" : "No"}
                  </div>
                  <div>🌍 Country: {results.countryResidence}</div>
                  <div>
                    📋 Status:{" "}
                    <span className="capitalize">{results.kycStatus}</span>
                  </div>
                  {results.faceMatchScore && (
                    <div>
                      👤 Face Match: {(results.faceMatchScore * 100).toFixed(1)}
                      %
                    </div>
                  )}
                  {results.timestamp != null && (
                    <div>
                      ⏰ Verified:{" "}
                      {new Date(results.timestamp).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>

              <p className="text-green-700 mb-6">
                Ready to generate your digital identity wallet pass?
              </p>

              <div className="space-x-4">
                <Button
                  onClick={goToResults}
                  className="bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  🎯 Generate Wallet Pass
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button variant="outline" onClick={goBack}>
                  📁 Upload Different Documents
                </Button>
              </div>
            </div>
          )}

          {/* Error State */}
          {isFailed && (
            <div className="mt-8 p-6 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-red-800 mb-2">
                Processing Failed
              </h3>
              <div className="text-red-700 mb-6">{kycFlow.error}</div>
              <div className="space-x-4">
                <Button
                  onClick={() => {
                    resetTask();
                    router.push("/kyc/upload");
                  }}
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-50"
                >
                  Try Again
                </Button>
                <Button
                  onClick={() => router.push("/kyc")}
                  variant="ghost"
                  className="text-red-600"
                >
                  Start Over
                </Button>
              </div>
            </div>
          )}

          {/* Processing State */}
          {isProcessing && (
            <div className="mt-8 text-gray-600 text-sm">
              <p>
                ⏳ Please wait while your documents are being processed in the
                secure enclave...
              </p>
              <p className="text-xs mt-1">
                Real iExec processing typically takes 2-5 minutes
              </p>
              <p className="text-xs mt-1 text-blue-600">
                🛡️ Your documents are being analyzed by AI in Intel SGX/TDX
                secure environment
              </p>
            </div>
          )}
        </div>

        {/* Processing Information */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
            <Shield className="w-6 h-6 text-blue-500 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-800">Secure Processing</h3>
              <p className="text-blue-700 text-sm mt-1">
                Your documents are processed in Intel SGX/TDX secure enclaves on
                iExec network
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-4 bg-green-50 rounded-lg">
            <Cpu className="w-6 h-6 text-green-500 mt-1" />
            <div>
              <h3 className="font-semibold text-green-800">AI Verification</h3>
              <p className="text-green-700 text-sm mt-1">
                Advanced AI algorithms analyze documents and validate identity
                information
              </p>
            </div>
          </div>
        </div>

        {/* Real-time Logs */}
        {taskStatus.logs.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Processing Logs</h3>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg max-h-64 overflow-y-auto font-mono text-sm">
              {taskStatus.logs.map((log, index) => (
                <div key={`${log}-${index}`} className="mb-1">
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Debug Info */}
        <DebugSection
          data={{
            appAddress: process.env.NEXT_PUBLIC_IEXEC_KYC_APP_ADDRESS,
            protectedData: kycFlow.protectedDataAddress,
            taskId: taskStatus.taskId,
            status: taskStatus.status,
            progress: taskStatus.progress,
            duration: formatDuration(duration),
            results: results ? "Generated" : "Not yet",
            hasResults: !!results,
            workflow:
              "Upload → Protect → Grant → Real iExec Processing → Results",
            iexecReady,
            siweSession: "Active - No additional signatures needed!",
          }}
        />
      </div>
    </LoginGated>
  );
}
