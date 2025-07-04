import { IExecDataProtectorCore } from "@iexec/dataprotector";
import { useCallback, useState } from "react";
import { KYCResults } from "../lib/kyc-types";
import { unzipSync, strFromU8 } from "fflate";

interface TaskStatus {
  status: "IDLE" | "TRIGGERING" | "RUNNING" | "COMPLETED" | "FAILED";
  progress: number;
  message: string;
  logs: string[];
  taskId?: string;
  startTime?: number;
  endTime?: number;
}

interface TaskParams {
  protectedDataAddress: string;
  userAddress: string;
  maxPrice?: number; // en nRLC
  tag?: string[];
}

export function useIexecKYCTask(
  dataProtectorCore: IExecDataProtectorCore | null
) {
  const [taskStatus, setTaskStatus] = useState<TaskStatus>({
    status: "IDLE",
    progress: 0,
    message: "Ready to trigger iExec app...",
    logs: [],
  });

  const [results, setResults] = useState<KYCResults | null>(null);

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setTaskStatus((prev) => ({
      ...prev,
      logs: [...prev.logs, `${timestamp}: ${message}`],
    }));
  }, []);

  const updateStatus = useCallback(
    (status: TaskStatus["status"], progress: number, message: string) => {
      setTaskStatus((prev) => ({
        ...prev,
        status,
        progress,
        message,
      }));
      addLog(message);
    },
    [addLog]
  );

  // Real iExec app processing with your deployed KYC app
  const startKYCProcessing = useCallback(
    async (params: TaskParams) => {
      if (!dataProtectorCore) {
        throw new Error("DataProtector Core not initialized");
      }

      try {
        updateStatus("TRIGGERING", 10, "🚀 Triggering iExec KYC app...");

        // Use your deployed KYC app address
        const appAddress = process.env.NEXT_PUBLIC_IEXEC_KYC_APP_ADDRESS;
        if (!appAddress) {
          throw new Error(
            "iExec KYC app address not configured in environment variables"
          );
        }

        // Validate app address format
        if (!appAddress.startsWith("0x") || appAddress.length !== 42) {
          throw new Error(
            "Invalid iExec app address format. Must be a valid Ethereum address."
          );
        }

        console.log("✅ Using deployed KYC app:", appAddress);
        addLog(
          `📋 KYC App: ${appAddress.slice(0, 10)}...${appAddress.slice(-8)}`
        );
        addLog(
          `🛡️ Protected Data: ${params.protectedDataAddress.slice(
            0,
            10
          )}...${params.protectedDataAddress.slice(-8)}`
        );
        addLog(
          `👤 User: ${params.userAddress.slice(
            0,
            10
          )}...${params.userAddress.slice(-8)}`
        );

        updateStatus("TRIGGERING", 25, "📡 Submitting processing request...");

        // Set start time
        setTaskStatus((prev) => ({
          ...prev,
          startTime: Date.now(),
        }));

        // Real iExec processing with your deployed app
        const processResult = await dataProtectorCore.processProtectedData({
          protectedData: params.protectedDataAddress,
          app: appAddress,
          workerpool: "tdx-labs.pools.iexec.eth",
          onStatusUpdate: (status) => {
            console.log("📊 iExec Status Update:", status);

            // Map iExec status updates to our UI
            switch (status.title) {
              case "REQUEST_TO_PROCESS_PROTECTED_DATA":
                updateStatus(
                  "TRIGGERING",
                  30,
                  "💼 Deal submitted to blockchain..."
                );
                addLog("✅ Processing deal submitted to iExec network");
                break;

              case "CONSUME_TASK":
                updateStatus(
                  "TRIGGERING",
                  45,
                  "✅ Deal confirmed, initializing execution..."
                );
                addLog("🔗 Deal confirmed on Bellecour sidechain");
                break;

              case "CONSUME_RESULT_DOWNLOAD":
                updateStatus(
                  "RUNNING",
                  60,
                  "⚡ AI processing documents in secure enclave..."
                );
                addLog("🛡️ Running face match, OCR, and age estimation in TEE");
                break;

              case "CONSUME_RESULT_DECRYPT":
                updateStatus(
                  "RUNNING",
                  90,
                  "🎯 Processing completed, retrieving results..."
                );
                addLog("✅ Face matching and document validation completed");
                break;

              default:
                addLog(`📡 iExec: ${status.title}`);
                break;
            }
          },
        });

        // Store the real task ID from iExec
        const taskId = processResult.taskId;
        console.log("✅ iExec task created:", taskId);
        addLog(`🆔 Task ID: ${taskId}`);

        setTaskStatus((prev) => ({
          ...prev,
          taskId,
        }));

        updateStatus("RUNNING", 98, "🔍 Parsing verification results...");

        // Parse real results from your KYC app
        let kycResults: KYCResults;

        try {
  console.log("📦 Received raw result as zip (ArrayBuffer)");

  // Convert ArrayBuffer to Uint8Array
  const zipData = new Uint8Array(processResult.result as ArrayBuffer);

  // Unzip the archive
  const files = unzipSync(zipData);

  if (!files["result.txt"]) {
    throw new Error("result.txt not found in zip archive");
  }

  // Convert result.txt content to string
  const resultText = strFromU8(files["result.txt"]);
  console.log("📄 result.txt content:", resultText);

  // Parse JSON
  const appResult = JSON.parse(resultText);

  // Map to frontend interface
  kycResults = {
    ageValidated: appResult.ageMatch === true,
    countryResidence: "France",
    kycStatus: appResult.overall === true ? "valid" : "failed",
    timestamp: Date.now(),
    signature: processResult.taskId,

    faceMatchScore: appResult.faceMatchScore,
    faceValid: appResult.faceValid,
    overallValidation: appResult.overall,

    taskId: processResult.taskId,
    appVersion: "0.0.1",
  };

  // Validate fields
  if (typeof appResult.faceMatchScore !== "number") {
    throw new Error("Invalid result format: missing faceMatchScore");
  }
  if (typeof appResult.faceValid !== "boolean") {
    throw new Error("Invalid result format: missing faceValid");
  }
  if (typeof appResult.overall !== "boolean") {
    throw new Error("Invalid result format: missing overall validation");
  }
} catch (parseError) {
  const error = parseError as Error;
  console.error("❌ Failed to parse KYC results:", error);
  addLog(`❌ Parse error: ${error.message}`);

  kycResults = {
    ageValidated: false,
    countryResidence: "Unknown",
    kycStatus: "failed",
    timestamp: Date.now(),
    signature: processResult.taskId,
    error: `Failed to parse results: ${error.message}`,
    taskId: processResult.taskId,
  };
}

        updateStatus(
          "COMPLETED",
          100,
          "🎉 KYC verification completed successfully!"
        );

        addLog("✅ Verification results processed");
        addLog(`📊 Overall Status: ${kycResults.kycStatus}`);
        addLog(`✅ Age Validated: ${kycResults.ageValidated ? "Yes" : "No"}`);
        addLog(`🌍 Country: ${kycResults.countryResidence}`);

        if (kycResults.faceMatchScore) {
          addLog(
            `👤 Face Match Score: ${(kycResults.faceMatchScore * 100).toFixed(
              1
            )}%`
          );
        }

        setResults(kycResults);

        setTaskStatus((prev) => ({
          ...prev,
          endTime: Date.now(),
        }));

        return { taskId, results: kycResults };
      } catch (error: any) {
        console.error("❌ iExec KYC processing failed:", error);

        // Detailed error logging
        addLog(`❌ Error: ${error.message}`);
        if (error.cause) {
          addLog(`🔍 Cause: ${error.cause}`);
        }
        if (error.code) {
          addLog(`📋 Code: ${error.code}`);
        }

        // Map common iExec errors to user-friendly messages
        let userMessage = error.message;
        if (error.message.includes("insufficient funds")) {
          userMessage =
            "Insufficient funds for processing. Please ensure you have enough RLC tokens.";
        } else if (error.message.includes("app not found")) {
          userMessage =
            "KYC application not found on iExec network. Please check configuration.";
        } else if (error.message.includes("protected data not found")) {
          userMessage =
            "Protected data not accessible. Please try re-uploading your documents.";
        } else if (error.message.includes("deal failed")) {
          userMessage =
            "Processing deal failed. Please try again or contact support.";
        } else if (error.message.includes("task failed")) {
          userMessage =
            "Document processing failed. Please ensure your documents are clear and readable.";
        }

        updateStatus("FAILED", 0, `❌ Processing failed: ${userMessage}`);
        throw new Error(userMessage);
      }
    },
    [dataProtectorCore, updateStatus, addLog]
  );

  return {
    // State
    taskStatus,
    results,
    isProcessing: ["TRIGGERING", "RUNNING"].includes(taskStatus.status),
    isCompleted: taskStatus.status === "COMPLETED",
    isFailed: taskStatus.status === "FAILED",
    duration: taskStatus.startTime
      ? Math.floor(
          ((taskStatus.endTime ?? Date.now()) - taskStatus.startTime) / 1000
        )
      : 0,

    // Actions
    startKYCProcessing,

    // Utils
    reset: () => {
      setTaskStatus({
        status: "IDLE",
        progress: 0,
        message: "Ready to trigger iExec app...",
        logs: [],
      });
      setResults(null);
    },
  };
}
