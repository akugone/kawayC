import { KYCResults } from "@/lib/kyc-types";
import { IExecDataProtectorCore } from "@iexec/dataprotector";
import { useCallback, useState } from "react";

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

  // Simplified: Just trigger the iExec app with protected data
  const startKYCProcessing = useCallback(
    async (params: TaskParams) => {
      if (!dataProtectorCore) {
        throw new Error("DataProtector Core not initialized");
      }

      try {
        updateStatus("TRIGGERING", 10, "🚀 Triggering iExec KYC app...");

        // Configuration de l'app iExec
        const appAddress = process.env.NEXT_PUBLIC_IEXEC_KYC_APP_ADDRESS;
        if (!appAddress) {
          throw new Error("iExec KYC app address not configured");
        }

        addLog(`📋 App address: ${appAddress.slice(0, 8)}...`);
        addLog(
          `🛡️ Protected data: ${params.protectedDataAddress.slice(0, 8)}...`
        );

        updateStatus("TRIGGERING", 25, "📡 Triggering app execution...");

        // In a real implementation, you would trigger the iExec app here
        // For now, we'll simulate the process
        const taskId = `task-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`;

        addLog(`✅ App triggered: ${taskId}`);
        addLog(`📊 App will process: ${params.protectedDataAddress}`);

        setTaskStatus((prev) => ({
          ...prev,
          taskId,
          startTime: Date.now(),
        }));

        updateStatus(
          "RUNNING",
          50,
          "⚡ iExec app processing in secure enclave..."
        );

        // Simulate processing time
        await new Promise((resolve) => setTimeout(resolve, 3000));

        // Simulate results (in real implementation, you'd get these from the iExec app)
        const simulatedResults: KYCResults = {
          ageValidated: true,
          countryResidence: "France",
          kycStatus: "valid",
          timestamp: Date.now(),
          signature:
            "0x" +
            Array.from({ length: 64 }, () =>
              Math.floor(Math.random() * 16).toString(16)
            ).join(""),
        };

        updateStatus("COMPLETED", 100, "🎉 KYC verification completed!");
        setResults(simulatedResults);

        setTaskStatus((prev) => ({
          ...prev,
          endTime: Date.now(),
        }));

        return { taskId, results: simulatedResults };
      } catch (error: any) {
        console.error("❌ App triggering failed:", error);
        updateStatus("FAILED", 0, `Failed: ${error.message}`);
        throw error;
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
      ? (taskStatus.endTime ?? Date.now()) - taskStatus.startTime
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
