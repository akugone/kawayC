"use client";

import { IExecDataProtector } from "@iexec/dataprotector";
import { ethers } from "ethers";
import { useMemo } from "react";
import { useAccount, useConnectorClient } from "wagmi";
import { useSIWE } from "./useSIWE";

// Type for iExec DataProtector status updates
interface StatusUpdate {
  title: string;
  [key: string]: any;
}

export function useIexecWithSIWE() {
  const { isConnected } = useAccount();
  const { data: connectorClient } = useConnectorClient();
  const { isSignedIn, getDerivedWallet } = useSIWE();

  // Create DataProtector instance with SIWE-derived wallet
  const dataProtectorCore = useMemo(() => {
    if (!isConnected || !isSignedIn || !connectorClient) {
      return null;
    }

    try {
      // Get the derived wallet from SIWE
      const derivedWallet = getDerivedWallet();

      if (!derivedWallet) {
        console.warn("No derived wallet available from SIWE");
        return null;
      }

      console.log("🔐 Creating DataProtector with SIWE-derived wallet");
      console.log("📍 Derived wallet address:", derivedWallet.address);

      // Convert viem client to ethers provider and connect to derived wallet
      const ethersProvider = new ethers.BrowserProvider(connectorClient.transport);
      const connectedWallet = derivedWallet.connect(ethersProvider);

      console.log("🔗 Connected derived wallet to ethers provider");

      const dataProtector = new IExecDataProtector(connectedWallet, {
        iexecOptions: {
          // Use debug URLs for development
          smsURL: {
            scone: "https://sms.scone-debug.v8-bellecour.iex.ec",
            gramine: "https://sms.gramine-debug.v8-bellecour.iex.ec",
          },
        },
      });

      return dataProtector.core;
    } catch (error) {
      console.error("Failed to create DataProtector with SIWE:", error);
      return null;
    }
  }, [isConnected, isSignedIn, connectorClient, getDerivedWallet]);

  // Protect data with seamless SIWE experience
  const protectData = async (data: any, options: any = {}) => {
    if (!dataProtectorCore) {
      throw new Error("DataProtector not initialized. Please sign in first.");
    }

    console.log("🔒 Protecting data with SIWE session...");

    return await dataProtectorCore.protectData({
      name: `KYC-${Date.now()}`,
      data,
      ...options,
      onStatusUpdate: (status: StatusUpdate) => {
        console.log(`📊 DataProtector: ${status.title}`, status);
        if (options.onStatusUpdate) {
          options.onStatusUpdate(status);
        }
      },
    });
  };

  // Grant access with seamless SIWE experience
  const grantAccess = async (params: any) => {
    if (!dataProtectorCore) {
      throw new Error("DataProtector not initialized. Please sign in first.");
    }

    console.log("🔑 Granting access with SIWE session...");

    return await dataProtectorCore.grantAccess({
      ...params,
      onStatusUpdate: (status: StatusUpdate) => {
        console.log(`🔐 Grant Access: ${status.title}`, status);
        if (params.onStatusUpdate) {
          params.onStatusUpdate(status);
        }
      },
    });
  };

  // Process protected data with seamless SIWE experience
  const processProtectedData = async (params: any) => {
    if (!dataProtectorCore) {
      throw new Error("DataProtector not initialized. Please sign in first.");
    }

    console.log("⚡ Processing protected data with SIWE session...");

    return await dataProtectorCore.processProtectedData({
      ...params,
      onStatusUpdate: (status: StatusUpdate) => {
        console.log(`🔄 Processing: ${status.title}`, status);
        if (params.onStatusUpdate) {
          params.onStatusUpdate(status);
        }
      },
    });
  };

  // Get protected data list
  const getProtectedData = async (params: any = {}) => {
    if (!dataProtectorCore) {
      throw new Error("DataProtector not initialized. Please sign in first.");
    }

    const derivedWallet = getDerivedWallet();
    if (!derivedWallet) {
      throw new Error("No derived wallet available");
    }

    return await dataProtectorCore.getProtectedData({
      owner: derivedWallet.address,
      ...params,
    });
  };

  return {
    // State
    isReady: !!dataProtectorCore,
    isSignedIn,
    dataProtectorCore,

    // Actions - All operations are seamless without additional signatures
    protectData,
    grantAccess,
    processProtectedData,
    getProtectedData,

    // Utils
    getDerivedWallet,
    derivedWalletAddress: getDerivedWallet()?.address,
  };
}
