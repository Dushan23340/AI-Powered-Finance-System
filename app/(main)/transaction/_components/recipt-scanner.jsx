"use client";

import { useRef, useEffect, useState } from "react";
import { Camera, Loader2, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import useFetch from "@/hooks/use-fetch";
import { scanReceipt } from "@/actions/transaction";
import imageCompression from "browser-image-compression";

export function ReceiptScanner({ onScanComplete }) {
  const fileInputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [lastFile, setLastFile] = useState(null);

  const {
    loading: scanReceiptLoading,
    fn: scanReceiptFn,
    data: scannedData,
    error: scanError,
  } = useFetch(scanReceipt);

  const handleReceiptScan = async (file) => {
    try {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size should be less than 5MB");
        return;
      }

      setPreviewUrl(URL.createObjectURL(file));
      setLastFile(file);

      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
      };

      const compressedFile = await imageCompression(file, options);
      await scanReceiptFn(compressedFile);
    } catch (error) {
      toast.error("Failed to process the receipt image.");
    }
  };

  useEffect(() => {
    if (scannedData && !scanReceiptLoading) {
      onScanComplete?.(scannedData);
      toast.success("Receipt scanned successfully");
    }
  }, [scanReceiptLoading, scannedData]);

  return (
    <div className="flex flex-col gap-4">
      {/* Upload input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        capture="environment"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleReceiptScan(file);
        }}
      />

      {/* Scan Button */}
      <Button
        type="button"
        variant="outline"
        className="w-full h-10 bg-gradient-to-br from-orange-500 via-pink-500 to-purple-500 animate-gradient hover:opacity-90 transition-opacity text-white hover:text-white"
        onClick={() => fileInputRef.current?.click()}
        disabled={scanReceiptLoading}
      >
        {scanReceiptLoading ? (
          <>
            <Loader2 className="mr-2 animate-spin" />
            <span>Scanning Receipt...</span>
          </>
        ) : (
          <>
            <Camera className="mr-2" />
            <span>Scan Receipt with AI</span>
          </>
        )}
      </Button>

      {/* Retry Button */}
      {scanError && lastFile && !scanReceiptLoading && (
        <Button
          type="button"
          variant="secondary"
          className="w-full flex items-center justify-center gap-2"
          onClick={() => handleReceiptScan(lastFile)}
        >
          <RefreshCcw className="w-4 h-4" />
          Retry Scan
        </Button>
      )}

      {/* Image Preview */}
      {previewUrl && (
        <img
          src={previewUrl}
          alt="Receipt preview"
          className="w-full max-w-xs rounded shadow-md self-center"
        />
      )}

      {/* Extracted Receipt Data */}
      {scannedData && (
        <div className="p-4 border rounded bg-muted text-sm space-y-1">
          <p><strong>Merchant:</strong> {scannedData.merchant || "N/A"}</p>
          <p><strong>Total:</strong> LKR {scannedData.amount || "N/A"}</p>
          <p>
            <strong>Date:</strong>{" "}
            {scannedData.date
              ? new Date(scannedData.date).toString() !== "Invalid Date"
                ? new Date(scannedData.date).toLocaleDateString()
                : "Invalid Date"
              : "N/A"}
          </p>
        </div>
      )}
    </div>
  );
}
