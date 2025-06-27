"use client";

import { useCallback, useEffect, useState } from "react";
import { KYCDocument, KYCResults } from "../lib/kyc-types";
import { KYC_SESSION_KEY, kycSessionUtils } from "../lib/utils";

interface SimpleKYCFlow {
  // Documents state
  documents: {
    selfie?: KYCDocument;
    id?: KYCDocument;
    addressProof?: KYCDocument;
  };

  // Processing state
  processing: boolean;
  statusMessage: string;

  // Results
  protectedDataAddress?: string;
  taskId?: string;
  results?: KYCResults;
  error?: string;
}

export function useSimpleKycFlow() {
  const [kycFlow, setKycFlow] = useState<SimpleKYCFlow>({
    documents: {},
    processing: false,
    statusMessage: "Ready to start KYC verification",
  });

  // Load state from localStorage on mount
  useEffect(() => {
    console.log("🔄 Loading KYC state from localStorage...");
    try {
      const savedState = localStorage.getItem(KYC_SESSION_KEY);
      if (savedState) {
        console.log("📦 Found saved state:", savedState);
        const parsedState = JSON.parse(savedState);
        // Note: We can't restore File objects from localStorage, so we'll skip documents
        // Users will need to re-upload documents if they refresh, but processing state will persist
        setKycFlow((prev) => ({
          ...prev,
          processing: parsedState.processing ?? false,
          statusMessage:
            parsedState.statusMessage ?? "Ready to start KYC verification",
          protectedDataAddress: parsedState.protectedDataAddress,
          taskId: parsedState.taskId,
          results: parsedState.results,
          error: parsedState.error,
        }));
        console.log("✅ State restored from localStorage");
      } else {
        console.log("📭 No saved state found in localStorage");
      }
    } catch (error) {
      console.warn("Failed to load KYC state from localStorage:", error);
    }
  }, []);

  // Save state to localStorage whenever it changes
  const saveState = useCallback((newState: SimpleKYCFlow) => {
    console.log("💾 Saving KYC state to localStorage...");
    try {
      // Don't save File objects to localStorage as they can't be serialized
      const stateToSave = {
        ...newState,
        documents: {}, // Don't persist documents
      };
      localStorage.setItem(KYC_SESSION_KEY, JSON.stringify(stateToSave));
      console.log("✅ State saved to localStorage:", stateToSave);
    } catch (error) {
      console.warn("Failed to save KYC state to localStorage:", error);
    }
  }, []);

  // Add a document
  const addDocument = useCallback(
    (document: KYCDocument) => {
      setKycFlow((prev) => {
        const newDocuments = {
          ...prev.documents,
          [document.type]: document,
        };
        // If user re-uploads all 3 docs while processing, reset processing state
        const shouldResetProcessing =
          prev.processing && Object.keys(newDocuments).length === 3;
        const newState = {
          ...prev,
          documents: newDocuments,
          error: undefined, // Clear errors when adding documents
          ...(shouldResetProcessing
            ? {
                processing: false,
                statusMessage: "Ready to start KYC verification",
                protectedDataAddress: undefined,
                taskId: undefined,
                results: undefined,
              }
            : {}),
        };
        saveState(newState);
        return newState;
      });
    },
    [saveState]
  );

  // Remove a document
  const removeDocument = useCallback(
    (type: KYCDocument["type"]) => {
      setKycFlow((prev) => {
        const newDocuments = { ...prev.documents };
        if (type in newDocuments) {
          delete newDocuments[type];
        }
        const newState = {
          ...prev,
          documents: newDocuments,
        };
        saveState(newState);
        return newState;
      });
    },
    [saveState]
  );

  // Start processing (protectData + grantAccess + processProtectedData)
  const startProcessing = useCallback(
    (protectedDataAddress: string) => {
      setKycFlow((prev) => {
        const newState = {
          ...prev,
          processing: true,
          protectedDataAddress,
          statusMessage: "Starting secure processing...",
          error: undefined,
        };
        saveState(newState);
        return newState;
      });
    },
    [saveState]
  );

  // Update processing status
  const updateStatus = useCallback(
    (message: string) => {
      setKycFlow((prev) => {
        const newState = {
          ...prev,
          statusMessage: message,
        };
        saveState(newState);
        return newState;
      });
    },
    [saveState]
  );

  // Set task ID when processing starts
  const setTaskId = useCallback(
    (taskId: string) => {
      setKycFlow((prev) => {
        const newState = {
          ...prev,
          taskId,
          statusMessage: "Processing in secure enclave...",
        };
        saveState(newState);
        return newState;
      });
    },
    [saveState]
  );

  // Complete processing with results
  const completeProcessing = useCallback(
    (results: KYCResults) => {
      setKycFlow((prev) => {
        const newState = {
          ...prev,
          processing: false,
          results,
          statusMessage: "KYC verification completed successfully!",
        };
        saveState(newState);
        return newState;
      });
    },
    [saveState]
  );

  // Handle errors
  const setError = useCallback(
    (error: string) => {
      setKycFlow((prev) => {
        const newState = {
          ...prev,
          processing: false,
          error,
          statusMessage: "Error occurred during processing",
        };
        saveState(newState);
        return newState;
      });
    },
    [saveState]
  );

  // Reset everything
  const reset = useCallback(() => {
    const newState = {
      documents: {},
      processing: false,
      statusMessage: "Ready to start KYC verification",
    };
    setKycFlow(newState);
    saveState(newState);
    // Clear localStorage using utility
    kycSessionUtils.clearSession();
  }, [saveState]);

  // Computed properties
  const isReady = Object.keys(kycFlow.documents).length === 3;
  const hasResults = !!kycFlow.results;
  const canProcess = isReady && !kycFlow.processing;

  return {
    // State
    kycFlow,
    isReady,
    hasResults,
    canProcess,

    // Actions
    addDocument,
    removeDocument,
    startProcessing,
    updateStatus,
    setTaskId,
    completeProcessing,
    setError,
    reset,
  };
}
