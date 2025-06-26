"use client";

import { CheckCircle, FileText, Home, Upload, User, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { DOCUMENT_TYPES, KYCDocument } from "../../lib/kyc-types";
import { fileToBuffer } from "../../lib/simplified-kyc-data";
import { Button } from "../ui/button";

interface DocumentUploadProps {
  type: KYCDocument["type"];
  document?: KYCDocument;
  onDocumentAdd: (document: KYCDocument) => void;
  onDocumentRemove: (type: KYCDocument["type"]) => void;
  disabled?: boolean;
}

export function DocumentUpload({
  type,
  document,
  onDocumentAdd,
  onDocumentRemove,
  disabled = false,
}: Readonly<DocumentUploadProps>) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const documentConfig = DOCUMENT_TYPES[type];

  const getIcon = () => {
    switch (type) {
      case "selfie":
        return <User className="w-8 h-8 text-blue-500" />;
      case "id":
        return <FileText className="w-8 h-8 text-green-500" />;
      case "addressProof":
        return <Home className="w-8 h-8 text-purple-500" />;
    }
  };

  const processFile = useCallback(
    async (file: File) => {
      setUploading(true);

      try {
        // Validate file
        if (file.size > 10 * 1024 * 1024) {
          // 10MB limit
          throw new Error("File size must be less than 10MB");
        }

        // Convert to Buffer for processing
        const buffer = await fileToBuffer(file);

        // Create preview URL
        const preview = URL.createObjectURL(file);

        const kycDocument: KYCDocument = {
          type,
          file,
          buffer,
          preview,
        };

        onDocumentAdd(kycDocument);
      } catch (error) {
        console.error("Error processing file:", error);
        alert(`Error processing file: ${error}`);
      } finally {
        setUploading(false);
      }
    },
    [type, onDocumentAdd]
  );

  const handleFileSelect = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const file = files[0];
      processFile(file);
    },
    [processFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);

      if (disabled) return;

      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect, disabled]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) {
        setDragOver(true);
      }
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleClick = useCallback(() => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  }, [disabled]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!disabled && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        fileInputRef.current?.click();
      }
    },
    [disabled]
  );

  const handleRemove = useCallback(() => {
    if (document?.preview) {
      URL.revokeObjectURL(document.preview);
    }
    onDocumentRemove(type);
  }, [document, onDocumentRemove, type]);

  if (document) {
    return (
      <div className="border rounded-lg p-4 bg-green-50 border-green-200">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-6 h-6 text-green-500" />
            <div>
              <h3 className="font-medium text-green-800">
                {documentConfig.label}
              </h3>
              <p className="text-sm text-green-600">{document.file.name}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRemove}
            disabled={disabled}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Preview */}
        <div className="mt-3">
          {document.file.type.startsWith("image/") ? (
            <img
              src={document.preview}
              alt={`${type} preview`}
              className="max-w-full h-32 object-cover rounded border"
            />
          ) : (
            <div className="flex items-center justify-center h-32 bg-gray-100 rounded border">
              <FileText className="w-8 h-8 text-gray-500" />
              <span className="ml-2 text-sm text-gray-600">PDF Document</span>
            </div>
          )}
        </div>

        <div className="mt-3 text-xs text-green-600">
          ✅ Document ready for secure processing
        </div>
      </div>
    );
  }

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept={documentConfig.accept}
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
        disabled={disabled}
      />

      <button
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        disabled={disabled}
        aria-describedby={`${type}-description`}
        className={`
          w-full border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
          ${
            dragOver
              ? "border-blue-400 bg-blue-50"
              : "border-gray-300 hover:border-gray-400"
          }
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          ${uploading ? "opacity-75" : ""}
          ${
            !disabled
              ? "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              : ""
          }
        `}
      >
        <div className="flex flex-col items-center space-y-4">
          {uploading ? (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          ) : (
            getIcon()
          )}

          <div>
            <h3 className="font-medium mb-1">{documentConfig.label}</h3>
            <p className="text-sm text-gray-600 mb-2">
              {documentConfig.description}
            </p>

            {uploading ? (
              <p className="text-sm text-blue-600">Processing file...</p>
            ) : (
              <div className="text-sm text-gray-500">
                <p>Click to upload or drag and drop</p>
                <p className="text-xs mt-1">Max file size: 10MB</p>
              </div>
            )}
          </div>

          {/* Hidden description for screen readers */}
          <div id={`${type}-description`} className="sr-only">
            {documentConfig.description}. Click to upload or drag and drop
            files. Maximum file size is 10MB.
          </div>

          {!uploading && <Upload className="w-5 h-5 text-gray-400" />}
        </div>
      </button>
    </div>
  );
}
