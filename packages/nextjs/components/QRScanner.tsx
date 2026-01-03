"use client";

import { useRef, useEffect, useState } from "react";
import Webcam from "react-webcam";
import { BrowserMultiFormatReader } from "@zxing/library";

interface QRScannerProps {
  onScan: (data: string) => void;
  onError: (error: string) => void;
  isActive: boolean;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScan, onError, isActive }) => {
  const webcamRef = useRef<Webcam>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const codeReader = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    if (isActive && !codeReader.current) {
      codeReader.current = new BrowserMultiFormatReader();
    }

    return () => {
      if (codeReader.current) {
        codeReader.current.reset();
      }
    };
  }, [isActive]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isActive && hasPermission && webcamRef.current && !isScanning) {
      setIsScanning(true);
      
      intervalId = setInterval(async () => {
        try {
          const imageSrc = webcamRef.current?.getScreenshot();
          if (imageSrc && codeReader.current) {
            const result = await codeReader.current.decodeFromImageUrl(imageSrc);
            if (result) {
              onScan(result.getText());
              setIsScanning(false);
            }
          }
        } catch (error) {
          // Continue scanning - this is expected when no QR code is found
        }
      }, 500); // Scan every 500ms
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      setIsScanning(false);
    };
  }, [isActive, hasPermission, onScan, isScanning]);

  const handleUserMedia = () => {
    setHasPermission(true);
  };

  const handleUserMediaError = (error: string | DOMException) => {
    setHasPermission(false);
    onError(typeof error === 'string' ? error : 'Camera access denied');
  };

  if (!isActive) {
    return null;
  }

  if (hasPermission === false) {
    return (
      <div className="text-center p-4">
        <div className="text-red-600 mb-2">Camera access denied</div>
        <div className="text-sm text-gray-600">
          Please allow camera access to scan QR codes
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <Webcam
        ref={webcamRef}
        audio={false}
        screenshotFormat="image/jpeg"
        videoConstraints={{
          width: 300,
          height: 300,
          facingMode: "environment" // Use back camera on mobile
        }}
        onUserMedia={handleUserMedia}
        onUserMediaError={handleUserMediaError}
        className="w-full rounded-lg"
      />
      
      {/* Scanning overlay */}
      <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none">
        <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-blue-500"></div>
        <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-blue-500"></div>
        <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-blue-500"></div>
        <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-blue-500"></div>
      </div>
      
      {/* Scanning indicator */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
        {isScanning ? "Scanning..." : "Position QR code in frame"}
      </div>
    </div>
  );
};