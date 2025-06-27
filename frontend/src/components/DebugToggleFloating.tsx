"use client";

import { usePathname } from "next/navigation";
import { DebugToggle } from "./ui/debug-toggle";

export function DebugToggleFloating() {
  const pathname = usePathname();
  if (pathname === "/") return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <DebugToggle variant="floating" />
    </div>
  );
}
