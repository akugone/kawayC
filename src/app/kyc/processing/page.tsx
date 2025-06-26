"use client";

import { Button } from "@/components/ui/button";
import { DebugSection } from "@/components/ui/debug-section";
import { useIexecKYCTask } from "@/hooks/useIexecKYCTask";
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
  const { isConnected, connector, address } = useAccount();
  const { kycFlow, setResults, setError, updateStep } = useKycFlow();

  const [dataProtectorCore, setDataProtectorCore] =
    useState<IExecDataProtectorCore | null>(null);

  // Nouveau hook pour gérer les tâches iExec
  const {
    taskStatus,
    results,
    isProcessing,
    isCompleted,
    isFailed,
    duration,
    startKYCProcessing,
    reset,
  } = useIexecKYCTask(dataProtectorCore);

  // Initialisation DataProtector
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

  // Auto-démarrage du processing
  useEffect(() => {
    if (
      dataProtectorCore &&
      kycFlow.protectedDataAddress &&
      address &&
      taskStatus.status === "IDLE"
    ) {
      console.log("🚀 Auto-starting KYC processing...");

      startKYCProcessing({
        protectedDataAddress: kycFlow.protectedDataAddress,
        userAddress: address,
        maxPrice: Number(process.env.NEXT_PUBLIC_IEXEC_MAX_PRICE) || 1000000000,
        tag: ["hackathon-2025"],
      }).catch((error) => {
        console.error("Auto-start failed:", error);
        setError(`Processing failed to start: ${error.message}`);
      });
    }
  }, [
    dataProtectorCore,
    kycFlow.protectedDataAddress,
    address,
    taskStatus.status,
    startKYCProcessing,
    setError,
  ]);

  // Gestion des résultats
  useEffect(() => {
    if (results) {
      console.log("✅ KYC Results received:", results);
      setResults(results);
      updateStep(4);

      // Auto-redirect vers les résultats après 3 secondes
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
      case "IDLE":
        return <Clock className="w-8 h-8 text-gray-500" />;
      case "TRIGGERING":
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

  const getStatusMessage = () => {
    switch (taskStatus.status) {
      case "IDLE":
        return "Ready to trigger iExec KYC app...";
      case "TRIGGERING":
        return "Triggering iExec app execution...";
      case "RUNNING":
        return "iExec app processing in Trusted Execution Environment...";
      case "COMPLETED":
        return "KYC verification completed successfully!";
      case "FAILED":
        return "App execution failed - please try again";
      default:
        return taskStatus.message;
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Wallet not connected</h1>
          <Button onClick={() => router.push("/")} className="mr-2">
            Connect Wallet
          </Button>
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
        <div className="text-center">
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
            {getStatusMessage()}
          </h2>
          <p className="text-gray-600 mb-4">{taskStatus.message}</p>

          {duration > 0 && (
            <p className="text-sm text-gray-500">
              {isCompleted ? "Completed in" : "Running for"}:{" "}
              {formatDuration(duration)}
            </p>
          )}

          {taskStatus.taskId && (
            <p className="text-xs text-gray-400 mt-2">
              Task ID: {taskStatus.taskId.slice(0, 16)}...
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
              <h3 className="font-semibold text-blue-800">
                Secure App Execution
              </h3>
              <p className="text-blue-700 text-sm mt-1">
                iExec app runs in Intel SGX/TDX Trusted Execution Environment
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-4 bg-green-50 rounded-lg">
            <Cpu className="w-6 h-6 text-green-500 mt-1" />
            <div>
              <h3 className="font-semibold text-green-800">AI Verification</h3>
              <p className="text-green-700 text-sm mt-1">
                Existing iExec app analyzes documents for age estimation and
                validation
              </p>
            </div>
          </div>
        </div>

        {/* Results Preview */}
        {results && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-green-800 mb-4">
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
                <span className="text-green-600">KYC Status:</span>
                <span className="ml-2 font-medium capitalize">
                  {results.kycStatus}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="text-center">
          {isCompleted && results && (
            <Button onClick={() => router.push("/kyc/result")} size="lg">
              <CheckCircle className="w-4 h-4 mr-2" />
              Generate Digital ID Card
            </Button>
          )}

          {isFailed && (
            <div className="space-x-4">
              <Button
                onClick={() => {
                  reset();
                  router.push("/kyc/upload");
                }}
                variant="outline"
                size="lg"
              >
                Try Again
              </Button>
              <Button
                onClick={() => router.push("/kyc")}
                variant="ghost"
                size="lg"
              >
                Start Over
              </Button>
            </div>
          )}

          {isProcessing && (
            <div className="text-gray-600 text-sm">
              <p>⏳ Please wait while your documents are being processed...</p>
              <p className="text-xs mt-1">
                Processing typically takes 2-5 minutes
              </p>
            </div>
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
                key={`log-${index}-${log.slice(0, 20)}`}
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
          taskId: taskStatus.taskId,
          status: taskStatus.status,
          progress: taskStatus.progress,
          duration: formatDuration(duration),
          appAddress: process.env.NEXT_PUBLIC_IEXEC_KYC_APP_ADDRESS,
        }}
      />
    </div>
  );
}
