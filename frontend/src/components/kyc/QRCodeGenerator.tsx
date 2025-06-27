"use client";

import { Copy, Download, RefreshCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { KYCResults } from "../../lib/kyc-types";
import { WalletPassGenerator } from "../../lib/wallet-pass";
import { Button } from "../ui/button";
import { DebugSection } from "../ui/debug-section";

interface QRCodeGeneratorProps {
  results: KYCResults;
  protectedDataAddress: string;
  size?: number;
  className?: string;
}

export function QRCodeGenerator({
  results,
  protectedDataAddress,
  size = 200,
  className = "",
}: Readonly<QRCodeGeneratorProps>) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrData, setQrData] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  // TODO: Replace with actual QR code library (e.g., qrcode)
  const generateQRPattern = (data: string, canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = size;
    canvas.height = size;

    // Clear canvas
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, size, size);

    // Calculate module size
    const modules = 25; // QR code grid size
    const moduleSize = size / modules;

    // Generate deterministic pattern based on data
    const seed = data
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    let random = seed;

    const pseudoRandom = () => {
      random = (random * 9301 + 49297) % 233280;
      return random / 233280;
    };

    // Draw border (finder patterns simulation)
    ctx.fillStyle = "#000000";

    // Top-left finder pattern
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 7; j++) {
        if (
          i === 0 ||
          i === 6 ||
          j === 0 ||
          j === 6 ||
          (i >= 2 && i <= 4 && j >= 2 && j <= 4)
        ) {
          ctx.fillRect(i * moduleSize, j * moduleSize, moduleSize, moduleSize);
        }
      }
    }

    // Top-right finder pattern
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 7; j++) {
        if (
          i === 0 ||
          i === 6 ||
          j === 0 ||
          j === 6 ||
          (i >= 2 && i <= 4 && j >= 2 && j <= 4)
        ) {
          ctx.fillRect(
            (modules - 7 + i) * moduleSize,
            j * moduleSize,
            moduleSize,
            moduleSize
          );
        }
      }
    }

    // Bottom-left finder pattern
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 7; j++) {
        if (
          i === 0 ||
          i === 6 ||
          j === 0 ||
          j === 6 ||
          (i >= 2 && i <= 4 && j >= 2 && j <= 4)
        ) {
          ctx.fillRect(
            i * moduleSize,
            (modules - 7 + j) * moduleSize,
            moduleSize,
            moduleSize
          );
        }
      }
    }

    // Fill data area with pattern
    for (let i = 0; i < modules; i++) {
      for (let j = 0; j < modules; j++) {
        // Skip finder patterns
        if (
          (i < 9 && j < 9) ||
          (i < 9 && j >= modules - 8) ||
          (i >= modules - 8 && j < 9)
        ) {
          continue;
        }

        // Generate pseudo-random pattern
        if (pseudoRandom() > 0.5) {
          ctx.fillRect(i * moduleSize, j * moduleSize, moduleSize, moduleSize);
        }
      }
    }

    // Add timing patterns
    for (let i = 8; i < modules - 8; i++) {
      if (i % 2 === 0) {
        ctx.fillRect(i * moduleSize, 6 * moduleSize, moduleSize, moduleSize);
        ctx.fillRect(6 * moduleSize, i * moduleSize, moduleSize, moduleSize);
      }
    }
  };

  const generateQRCode = async () => {
    setGenerating(true);

    try {
      // Generate QR data
      const data = WalletPassGenerator.generateQRCode(
        results,
        protectedDataAddress
      );
      setQrData(data);

      // Generate visual QR code
      if (canvasRef.current) {
        await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate processing
        generateQRPattern(data, canvasRef.current);
      }
    } catch (error) {
      console.error("Error generating QR code:", error);
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    generateQRCode();
  }, [results, protectedDataAddress, size]);

  const handleCopyData = async () => {
    try {
      await navigator.clipboard.writeText(qrData);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy QR data:", error);
    }
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;

    // Create download link
    const link = document.createElement("a");
    link.download = `kyc-verification-qr-${protectedDataAddress.slice(-8)}.png`;
    link.href = canvasRef.current.toDataURL();
    link.click();
  };

  const handleRegenerate = () => {
    generateQRCode();
  };

  return (
    <div className={`text-center ${className}`}>
      <div className="bg-white p-6 rounded-lg border inline-block">
        <canvas
          ref={canvasRef}
          className={`border rounded ${generating ? "opacity-50" : ""}`}
          style={{ width: size, height: size }}
        />

        {generating && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        )}
      </div>

      <div className="mt-4 space-y-2">
        <p className="text-sm text-gray-600">
          Scan to verify identity • ID: {protectedDataAddress.slice(-8)}
        </p>

        <div className="flex justify-center space-x-2">
          <Button
            onClick={handleCopyData}
            variant="outline"
            size="sm"
            disabled={!qrData}
          >
            <Copy className="w-4 h-4 mr-1" />
            {copied ? "Copied!" : "Copy Data"}
          </Button>

          <Button
            onClick={handleDownload}
            variant="outline"
            size="sm"
            disabled={generating}
          >
            <Download className="w-4 h-4 mr-1" />
            Download
          </Button>

          <Button
            onClick={handleRegenerate}
            variant="outline"
            size="sm"
            disabled={generating}
          >
            <RefreshCw
              className={`w-4 h-4 mr-1 ${generating ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* QR Data Preview (for debugging) */}
      <DebugSection
        data={{
          qrData: qrData.substring(0, 100) + "...",
        }}
        title="QR Data Preview"
        showTitle={false}
      />
    </div>
  );
}
