"use client";

import { useDebug } from "@/context/DebugContext";
import { kycSessionUtils } from "@/lib/utils";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

interface DebugSectionProps {
  data: Record<string, any>;
  title?: string;
  showTitle?: boolean;
}

export function DebugSection({
  data,
  title = "Debug Info",
  showTitle = true,
}: Readonly<DebugSectionProps>) {
  const { isDebugEnabled } = useDebug();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isDebugEnabled) {
    return null;
  }

  const sessionInfo = kycSessionUtils.getSessionInfo();

  return (
    <div className="mt-8 p-4 bg-gray-100 rounded-lg border">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-mono font-semibold text-gray-700">
          {showTitle ? title : ""}
        </h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-500 hover:text-gray-700"
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-4">
          {/* Session Info */}
          {sessionInfo && (
            <div className="p-3 bg-blue-50 rounded border">
              <h4 className="text-xs font-semibold text-blue-800 mb-2">
                Session State
              </h4>
              <div className="text-xs text-blue-700 space-y-1">
                <div>Processing: {sessionInfo.hasProcessing ? "✅" : "❌"}</div>
                <div>
                  Protected Data: {sessionInfo.hasProtectedData ? "✅" : "❌"}
                </div>
                <div>Results: {sessionInfo.hasResults ? "✅" : "❌"}</div>
                <div>Error: {sessionInfo.hasError ? "✅" : "❌"}</div>
                {sessionInfo.protectedDataAddress && (
                  <div>
                    Address: {sessionInfo.protectedDataAddress.slice(0, 10)}...
                  </div>
                )}
                {sessionInfo.statusMessage && (
                  <div>Status: {sessionInfo.statusMessage}</div>
                )}
              </div>
              <button
                onClick={kycSessionUtils.resetAndReload}
                className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
              >
                Clear Session & Reload
              </button>
            </div>
          )}

          {/* Data */}
          <div className="p-3 bg-gray-50 rounded border">
            <h4 className="text-xs font-semibold text-gray-800 mb-2">
              Component Data
            </h4>
            <pre className="text-xs text-gray-700 whitespace-pre-wrap">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
