"use client";

import { useDebug } from "@/context/DebugContext";
import { Bug } from "lucide-react";

interface DebugSectionProps {
  title?: string;
  data: any;
  className?: string;
  showTitle?: boolean;
}

export function DebugSection({
  title = "Debug Info",
  data,
  className = "",
  showTitle = true
}: DebugSectionProps) {
  const { isDebugEnabled } = useDebug();

  if (!isDebugEnabled) {
    return null;
  }

  return (
    <div className={`mt-8 p-4 bg-gray-100 rounded text-sm ${className}`}>
      {showTitle && (
        <div className="flex items-center mb-3">
          <Bug className="w-4 h-4 mr-2 text-gray-600" />
          <strong className="text-gray-800">{title}</strong>
        </div>
      )}
      <pre className="overflow-auto text-xs font-mono text-gray-700">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
