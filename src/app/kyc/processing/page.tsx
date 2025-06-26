"use client";

import { Button } from "@/components/ui/button";
import { DebugSection } from "@/components/ui/debug-section";
import { useIexecTask } from "@/hooks/useIexecTask";
import { useKycFlow } from "@/hooks/useKycFlow";
import { IExecDataProtectorCore } from "@iexec/dataprotector";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Clock,
  Cpu,
  Network,
  Shield,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

export default function KYCProcessingPage() {
  const router = useRouter();
  const { isConnected, connector } = useAccount();
  const { kycFlow, setResults, setError, updateStep } = useKycFlow();

  const [dataProtectorCore, setDataProtectorCore] =
    useState<IExecDataProtectorCore | null>(null);
  const {
    taskStatus,
    results,
    startProcessing,
    isProcessing,
    isCompleted,
    isFailed,
    duration,
  } = useIexecTask(dataProtectorCore);

  useEffect(() => {
    if (!isConnected) {
      router.push("/");
      return;
    }

    if (!kycFlow.protectedDataAddress) {
      router.push("/kyc/upload");
      return;
    }

    const initializeDataProtector = async () => {
      if (isConnected && connector) {
        try {
          const provider = await connector.getProvider();
          const { IExecDataProtector } = await import("@iexec/dataprotector");
          const dataProtector = new IExecDataProtector(provider as any);
          setDataProtectorCore(dataProtector.core);
        } catch (error) {
          console.error("Failed to initialize DataProtector:", error);
          setError("Failed to initialize secure connection");
        }
      }
    };

    initializeDataProtector();
  }, [isConnected, connector, router, kycFlow.protectedDataAddress, setError]);

  useEffect(() => {
    if (
      dataProtectorCore &&
      kycFlow.protectedDataAddress &&
      !isProcessing &&
      !isCompleted &&
      !isFailed
    ) {
      // Auto-start processing when page loads
      startProcessing(kycFlow.protectedDataAddress);
    }
  }, [
    dataProtectorCore,
    kycFlow.protectedDataAddress,
    isProcessing,
    isCompleted,
    isFailed,
    startProcessing,
  ]);

  useEffect(() => {
    if (results) {
      setResults(results);
      updateStep(4);
      // Auto-redirect to results after a short delay
      setTimeout(() => {
        router.push("/kyc/result");
      }, 3000);
    }
  }, [results, setResults, updateStep, router]);

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const getStatusIcon = () => {
    switch (taskStatus.status) {
      case "PENDING":
        return <Clock className="w-8 h-8 text-yellow-500" />;
      case "RUNNING":
        return (
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        );
      case "COMPLETED":
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case "FAILED":
        return <AlertCircle className="w-8 h-8 text-red-500" />;
      default:
        return <Clock className="w-8 h-8 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (taskStatus.status) {
      case "PENDING":
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

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Wallet not connected</h1>
          <div className="space-y-2">
            <Button onClick={() => router.push("/")} className="mr-2">
              Connect Wallet
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
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => router.push("/kyc")}
            className="mr-4"
            disabled={isProcessing}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
        <div>
          <h1 className="text-3xl font-bold">Confidential Processing</h1>
          <p className="text-gray-600">
            Your documents are being verified securely
          </p>
        </div>
      </div>

      {/* Main Status Card */}
      <div className="bg-white border rounded-lg p-8 mb-8">
        <div className="text-center mb-8">
          {getStatusIcon()}
          <h2
            className={`text-2xl font-semibold mt-4 mb-2 ${getStatusColor()}`}
          >
            {taskStatus.status === "PENDING" &&
              "Preparing Processing Environment"}
            {taskStatus.status === "RUNNING" && "Processing in Secure Enclave"}
            {taskStatus.status === "COMPLETED" &&
              "Verification Completed Successfully"}
            {taskStatus.status === "FAILED" && "Processing Failed"}
          </h2>
          <p className="text-gray-600 mb-4">{taskStatus.message}</p>

          {duration > 0 && (
            <p className="text-sm text-gray-500">
              {isCompleted ? "Completed in" : "Running for"}:{" "}
              {formatDuration(duration)}
            </p>
          )}
        </div>

        {/* Progress Bar */}
        {isProcessing && (
          <div className="mb-8">
            <div className="flex justify-between text-sm mb-2">
              <span>Progress</span>
              <span>{taskStatus.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${taskStatus.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Processing Info */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
            <Shield className="w-6 h-6 text-blue-500 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-800">Secure Processing</h3>
              <p className="text-blue-700 text-sm mt-1">
                Your documents are processed inside a Trusted Execution
                Environment (TEE) on the iExec network
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-4 bg-green-50 rounded-lg">
            <Cpu className="w-6 h-6 text-green-500 mt-1" />
            <div>
              <h3 className="font-semibold text-green-800">AI Verification</h3>
              <p className="text-green-700 text-sm mt-1">
                Advanced AI models analyze your documents for age estimation and
                identity validation
              </p>
            </div>
          </div>
        </div>

        {/* Results Preview */}
        {results && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-green-800 mb-4">
              Verification Results
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-green-600">Age Validated:</span>
                <span className="ml-2 font-medium">
                  {results.ageValidated ? "✅ Yes" : "❌ No"}
                </span>
              </div>
              <div>
                <span className="text-green-600">Country:</span>
                <span className="ml-2 font-medium">
                  {results.countryResidence}
                </span>
              </div>
              <div>
                <span className="text-green-600">KYC Status:</span>
                <span className="ml-2 font-medium capitalize">
                  {results.kycStatus}
                </span>
              </div>
              <div>
                <span className="text-green-600">Verified On:</span>
                <span className="ml-2 font-medium">
                  {new Date(results.timestamp).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="text-center">
          {isCompleted && results && (
            <Button onClick={() => router.push("/kyc/result")} size="lg">
              <CheckCircle className="w-4 h-4 mr-2" />
              Generate Digital ID Card
            </Button>
          )}
          {isFailed && (
            <Button
              onClick={() => router.push("/kyc/upload")}
              variant="outline"
              size="lg"
            >
              Try Again
            </Button>
          )}
          {isProcessing && (
            <p className="text-gray-600 text-sm">
              Please wait while your documents are being processed...
            </p>
          )}
        </div>
      </div>

      {/* Processing Logs */}
      {taskStatus.logs.length > 0 && (
        <div className="bg-gray-50 border rounded-lg p-6">
          <h3 className="font-semibold mb-4 flex items-center">
            <Network className="w-5 h-5 mr-2" />
            Processing Logs
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {taskStatus.logs.map((log, index) => (
              <div
                key={index}
                className="text-sm font-mono text-gray-700 bg-white px-3 py-1 rounded"
              >
                {log}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Debug Info */}
      <DebugSection
        data={{
          protectedData: kycFlow.protectedDataAddress,
          taskStatus: taskStatus.status,
          progress: taskStatus.progress,
          duration: formatDuration(duration),
        }}
      />
    </div>
  );
}
