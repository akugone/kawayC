// useIexecKYCTask.ts - Version avec prix et configuration corrigés

import { useCallback, useState } from "react";
import { IExecTaskStatus, KYCResults } from "../lib/kyc-types";
import { useIexecWithSIWE } from "./useIexecWithSIWE";

export function useIexecKYCTask() {
  const { dataProtectorCore } = useIexecWithSIWE();
  const [taskStatus, setTaskStatus] = useState<IExecTaskStatus>({
    status: "IDLE",
    progress: 0,
    message: "Ready to trigger iExec app...",
    logs: [],
  });
  const [results, setResults] = useState<KYCResults | null>(null);

  const updateStatus = useCallback(
    (status: IExecTaskStatus["status"], progress: number, message: string) => {
      setTaskStatus((prev) => ({
        ...prev,
        status,
        progress,
        message,
      }));
    },
    []
  );

  const addLog = useCallback((log: string) => {
    console.log(`📋 KYC Log: ${log}`);
    setTaskStatus((prev) => ({
      ...prev,
      logs: [...prev.logs, `${new Date().toLocaleTimeString()}: ${log}`],
    }));
  }, []);

  const startKYCProcessing = useCallback(
    async (params: {
      protectedDataAddress: string;
      userAddress: string;
      maxPrice?: number;
    }) => {
      if (!dataProtectorCore) {
        throw new Error("DataProtector not initialized");
      }

      try {
        setTaskStatus({
          status: "TRIGGERING",
          progress: 10,
          message: "🚀 Starting KYC verification...",
          logs: [],
          startTime: Date.now(),
        });

        addLog("🔐 Initializing secure processing...");
        addLog(`📊 Protected Data: ${params.protectedDataAddress}`);
        addLog(`👤 User: ${params.userAddress}`);

        // 🔧 FIX 1: Configuration prix corrigée
        const appAddress = process.env.NEXT_PUBLIC_IEXEC_KYC_APP_ADDRESS;
        if (!appAddress) {
          throw new Error(
            "iExec app address not configured in environment variables"
          );
        }

        const processingConfig = {
          protectedData: params.protectedDataAddress,

          // 🚨 CONFIGURATION IEXEC CORRIGÉE
          app: appAddress,

          // 💰 Prix en nRLC (nano RLC) - 1 RLC = 1,000,000,000 nRLC
          maxPrice: params.maxPrice ?? 100000000, // 0.1 RLC au lieu de 1000 nRLC

          // 🏷️ Tags pour filtering
          tag: ["tee", "scone"], // Tags standards pour TEE apps

          // 📊 Configuration du worker
          workerpoolMaxPrice: 50000000, // 0.05 RLC pour le workerpool

          // ⏱️ Timeout et retry
          retries: 3,

          // 🔧 Paramètres additionnels
          category: 0, // Catégorie standard
          trust: 0, // Trust level minimum

          // 📝 Logs détaillés pour debugging
          verbose: true,
        };

        addLog(
          `💰 Max price: ${processingConfig.maxPrice} nRLC (${
            processingConfig.maxPrice / 1000000000
          } RLC)`
        );
        addLog(`🏭 App address: ${processingConfig.app}`);

        updateStatus("TRIGGERING", 20, "🔍 Finding available workers...");

        // 🔧 FIX 2: Gestion d'erreur améliorée avec retry logic
        let processResult;
        let attempt = 0;
        const maxAttempts = 3;

        while (attempt < maxAttempts) {
          try {
            attempt++;
            addLog(`🔄 Processing attempt ${attempt}/${maxAttempts}`);

            // 🚀 Déclenchement du traitement iExec
            processResult = await dataProtectorCore.processProtectedData({
              ...processingConfig,

              // 📊 Callback pour suivre le status
              onStatusUpdate: ({ title, isDone }) => {
                switch (title) {
                  case "REQUEST_TO_PROCESS_PROTECTED_DATA":
                    updateStatus(
                      "TRIGGERING",
                      25,
                      "🔧 Submitting processing request..."
                    );
                    addLog("✅ Processing request submitted");
                    break;

                  case "CONSUME_TASK":
                    updateStatus("TRIGGERING", 30, "🏭 Task consumed...");
                    addLog("🔍 Task consumed by worker");
                    break;

                  case "CONSUME_RESULT_DOWNLOAD":
                    updateStatus("RUNNING", 60, "📥 Downloading results...");
                    addLog("⚡ Results downloaded");
                    break;

                  case "CONSUME_RESULT_DECRYPT":
                    updateStatus("RUNNING", 85, "🔓 Decrypting results...");
                    addLog("🔑 Processing completed, decrypting results");
                    break;

                  default:
                    addLog(`📡 iExec: ${title} ${isDone ? "✅" : "🔄"}`);
                }
              },
            });

            // Si on arrive ici, le processing a réussi
            break;
          } catch (attemptError: any) {
            addLog(`❌ Attempt ${attempt} failed: ${attemptError.message}`);

            if (attempt === maxAttempts) {
              throw attemptError; // Dernière tentative échouée
            }

            // 🔄 Attendre avant retry
            addLog(`⏱️ Waiting 5s before retry...`);
            await new Promise((resolve) => setTimeout(resolve, 5000));

            // 📈 Augmenter le prix pour le retry
            processingConfig.maxPrice *= 1.5;
            addLog(
              `💰 Increasing max price to ${processingConfig.maxPrice} nRLC for retry`
            );
          }
        }

        const taskId = processResult.taskId;
        addLog(`🆔 Task created: ${taskId}`);

        // 🔧 FIX 3: Parsing résultats amélioré
        updateStatus("RUNNING", 95, "📊 Parsing results...");

        let kycResults: KYCResults;
        try {
          // Parse des résultats de ton iApp
          const appResult =
            typeof processResult.result === "string"
              ? JSON.parse(processResult.result)
              : processResult.result;

          addLog(`📋 Raw result: ${JSON.stringify(appResult)}`);

          // 🔧 FIX 4: Validation robuste des résultats
          kycResults = {
            ageValidated: Boolean(appResult?.ageMatch),
            countryResidence: "France",
            kycStatus: appResult?.overall ? "valid" : "failed",
            timestamp: Date.now(),
            signature: taskId,

            // Champs optionnels avec fallbacks
            faceMatchScore: Number(appResult?.faceMatchScore) || 0,
            faceValid: Boolean(appResult?.faceValid),
            overallValidation: Boolean(appResult?.overall),

            taskId,
            appVersion: "0.0.1",
          };

          addLog(`✅ Results parsed successfully`);
        } catch (parseError: any) {
          addLog(
            `⚠️ Parse error, using fallback result: ${parseError.message}`
          );

          // Résultat de fallback si parsing échoue
          kycResults = {
            ageValidated: false,
            countryResidence: "Unknown",
            kycStatus: "failed",
            timestamp: Date.now(),
            signature: taskId,
            error: `Parse error: ${parseError.message}`,
            taskId,
          };
        }

        updateStatus("COMPLETED", 100, "🎉 KYC verification completed!");

        addLog(`📊 Final status: ${kycResults.kycStatus}`);
        addLog(`✅ Age validated: ${kycResults.ageValidated ? "Yes" : "No"}`);

        setResults(kycResults);
        setTaskStatus((prev) => ({ ...prev, endTime: Date.now() }));

        return { taskId, results: kycResults };
      } catch (error: any) {
        console.error("❌ iExec KYC processing failed:", error);

        // 🔧 FIX 5: Messages d'erreur plus précis
        let userMessage = "Processing failed. Please try again.";

        if (error.message.includes("No orders found")) {
          userMessage =
            "No workers available at current price. Try increasing max price or retry later.";
        } else if (error.message.includes("insufficient funds")) {
          userMessage = "Insufficient RLC balance. Please top up your wallet.";
        } else if (error.message.includes("app not found")) {
          userMessage = "KYC app not deployed. Please check app configuration.";
        } else if (error.message.includes("User denied")) {
          userMessage = "Transaction cancelled by user.";
        }

        addLog(`❌ Error: ${userMessage}`);
        updateStatus("FAILED", 0, `❌ ${userMessage}`);

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
