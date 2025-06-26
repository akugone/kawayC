"use client";

import { useState, useEffect, useCallback } from 'react';
import { IExecDataProtectorCore } from '@iexec/dataprotector';
import { KYCResults } from '@/lib/kyc-types';

interface TaskStatus {
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  progress: number;
  message: string;
  logs: string[];
  startTime?: number;
  endTime?: number;
}

export function useIexecTask(dataProtectorCore: IExecDataProtectorCore | null) {
  const [taskStatus, setTaskStatus] = useState<TaskStatus>({
    status: 'PENDING',
    progress: 0,
    message: 'Waiting to start...',
    logs: []
  });

  const [taskId, setTaskId] = useState<string | null>(null);
  const [results, setResults] = useState<KYCResults | null>(null);

  const addLog = useCallback((log: string) => {
    setTaskStatus(prev => ({
      ...prev,
      logs: [...prev.logs, `${new Date().toLocaleTimeString()}: ${log}`]
    }));
  }, []);

  const updateProgress = useCallback((progress: number, message: string) => {
    setTaskStatus(prev => ({
      ...prev,
      progress,
      message,
    }));
    addLog(message);
  }, [addLog]);

  // Simulate iExec task processing (replace with real implementation)
  const simulateProcessing = useCallback(async () => {
    if (!dataProtectorCore) return;

    setTaskStatus(prev => ({
      ...prev,
      status: 'RUNNING',
      startTime: Date.now()
    }));

    // Simulate processing steps
    const steps = [
      { progress: 10, message: "Initializing secure enclave...", delay: 2000 },
      { progress: 25, message: "Loading AI models...", delay: 3000 },
      { progress: 40, message: "Processing selfie for age estimation...", delay: 4000 },
      { progress: 60, message: "Analyzing ID document with OCR...", delay: 3000 },
      { progress: 75, message: "Validating proof of residence...", delay: 2000 },
      { progress: 90, message: "Cross-referencing document coherence...", delay: 2000 },
      { progress: 100, message: "Generating secure verification result...", delay: 1000 }
    ];

    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, step.delay));
      updateProgress(step.progress, step.message);
    }

    // Simulate successful result
    const mockResults: KYCResults = {
      ageValidated: true,
      countryResidence: "France",
      kycStatus: "valid",
      timestamp: Date.now(),
      signature: "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
    };

    setResults(mockResults);
    setTaskStatus(prev => ({
      ...prev,
      status: 'COMPLETED',
      endTime: Date.now(),
      message: 'KYC verification completed successfully!'
    }));
    addLog('✅ Processing completed successfully');

    return mockResults;
  }, [dataProtectorCore, updateProgress, addLog]);

  // Real iExec task implementation (to be implemented when backend is ready)
  const startRealTask = useCallback(async (protectedDataAddress: string) => {
    if (!dataProtectorCore) {
      throw new Error('DataProtector not initialized');
    }

    try {
      addLog('🚀 Starting real iExec task...');

      // This would be the real implementation:
      /*
      const task = await dataProtectorCore.processProtectedData({
        protectedDataAddress,
        app: 'your-kyc-app-address',
        maxPrice: 1000000000, // 1 nRLC
        tag: ['tee', 'confidential'],
        args: ['--kyc-mode', 'full-verification']
      });

      setTaskId(task.taskId);
      addLog(`📋 Task created: ${task.taskId}`);

      // Poll for task completion
      const intervalId = setInterval(async () => {
        try {
          const taskInfo = await dataProtectorCore.getTaskInfo(task.taskId);

          if (taskInfo.status === 'COMPLETED') {
            clearInterval(intervalId);
            const result = await dataProtectorCore.getTaskResult(task.taskId);
            setResults(result);
            setTaskStatus(prev => ({ ...prev, status: 'COMPLETED' }));
          } else if (taskInfo.status === 'FAILED') {
            clearInterval(intervalId);
            setTaskStatus(prev => ({ ...prev, status: 'FAILED' }));
          }
        } catch (error) {
          console.error('Error polling task:', error);
        }
      }, 5000);

      return task;
      */

      // For now, use simulation
      return await simulateProcessing();

    } catch (error) {
      console.error('Error starting task:', error);
      setTaskStatus(prev => ({
        ...prev,
        status: 'FAILED',
        message: `Failed to start processing: ${error}`
      }));
      addLog(`❌ Task failed: ${error}`);
      throw error;
    }
  }, [dataProtectorCore, addLog, simulateProcessing]);

  // Convenience method to start processing
  const startProcessing = useCallback(async (protectedDataAddress: string) => {
    try {
      addLog('🔄 Starting KYC processing...');
      return await startRealTask(protectedDataAddress);
    } catch (error) {
      console.error('Processing failed:', error);
      throw error;
    }
  }, [startRealTask, addLog]);

  return {
    taskStatus,
    taskId,
    results,
    startProcessing,
    isProcessing: taskStatus.status === 'RUNNING',
    isCompleted: taskStatus.status === 'COMPLETED',
    isFailed: taskStatus.status === 'FAILED',
    duration: taskStatus.startTime && taskStatus.endTime
      ? taskStatus.endTime - taskStatus.startTime
      : taskStatus.startTime
        ? Date.now() - taskStatus.startTime
        : 0
  };
}
