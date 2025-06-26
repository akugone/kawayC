"use client";

import { DebugToggle } from "@/components/ui/debug-toggle";
import { usePathname } from "next/navigation";

export function DebugToggleFloating() {
  const pathname = usePathname();
  if (pathname === "/") return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <DebugToggle variant="floating" />
    </div>
  );
}
