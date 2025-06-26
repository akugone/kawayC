"use client";

import { wagmiAdapter } from "@/config/wagmiConfig";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import { DebugProvider } from "./DebugContext";

// Set up queryClient
const queryClient = new QueryClient();

function ContextProvider({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <DebugProvider>{children}</DebugProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default ContextProvider;
