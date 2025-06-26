"use client";

import { useState, useCallback } from "react";
import { KYCFlow, KYCDocument, KYCResults, KYC_STEPS } from "@/lib/kyc-types";

export function useKycFlow() {
  const [kycFlow, setKycFlow] = useState<KYCFlow>({
    currentStep: 1,
    documents: {},
    processing: false,
  });

  const updateStep = useCallback((step: number) => {
    setKycFlow((prev) => ({
      ...prev,
      currentStep: step,
    }));
  }, []);

  const addDocument = useCallback((document: KYCDocument) => {
    setKycFlow((prev) => ({
      ...prev,
      documents: {
        ...prev.documents,
        [document.type]: document,
      },
    }));
  }, []);

  const removeDocument = useCallback((type: KYCDocument["type"]) => {
    setKycFlow((prev) => {
      const newDocuments = { ...prev.documents };
      delete newDocuments[type];
      return {
        ...prev,
        documents: newDocuments,
      };
    });
  }, []);

  const setProtectedDataAddress = useCallback((address: string) => {
    setKycFlow((prev) => ({
      ...prev,
      protectedDataAddress: address,
    }));
  }, []);

  const setTaskId = useCallback((taskId: string) => {
    setKycFlow((prev) => ({
      ...prev,
      taskId,
      processing: true,
    }));
  }, []);

  const setResults = useCallback((results: KYCResults) => {
    setKycFlow((prev) => ({
      ...prev,
      results,
      processing: false,
      currentStep: 4,
    }));
  }, []);

  const setError = useCallback((error: string) => {
    setKycFlow((prev) => ({
      ...prev,
      error,
      processing: false,
    }));
  }, []);

  const resetFlow = useCallback(() => {
    setKycFlow({
      currentStep: 1,
      documents: {},
      processing: false,
    });
  }, []);

  // Computed properties
  const isDocumentsComplete = Object.keys(kycFlow.documents).length === 3;
  const canProceedToProcessing =
    isDocumentsComplete && kycFlow.protectedDataAddress;
  const hasResults = !!kycFlow.results;

  const currentStepInfo = KYC_STEPS.find(
    (step) => step.id === kycFlow.currentStep
  );

  const getStepsWithStatus = () => {
    return KYC_STEPS.map((step) => ({
      ...step,
      completed: step.id < kycFlow.currentStep || (step.id === 4 && hasResults),
      current: step.id === kycFlow.currentStep,
    }));
  };

  return {
    // State
    kycFlow,
    isDocumentsComplete,
    canProceedToProcessing,
    hasResults,
    currentStepInfo,

    // Actions
    updateStep,
    addDocument,
    removeDocument,
    setProtectedDataAddress,
    setTaskId,
    setResults,
    setError,
    resetFlow,
    getStepsWithStatus,
  };
}
