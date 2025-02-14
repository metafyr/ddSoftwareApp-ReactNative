import { useState } from "react";
import * as ImagePicker from 'expo-image-picker';

interface DocumentScannerProps {
  qrCodeId: string;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export const useDocumentScanner = ({
  qrCodeId,
  onSuccess,
  onError,
}: DocumentScannerProps) => {
  const [isScanning, setIsScanning] = useState(false);

  const handleScan = async () => {
    try {
      setIsScanning(true);
      
      // Request camera permission
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        onError('Camera permission is required to scan documents');
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
        allowsEditing: true,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets[0]) {
        onSuccess("Document scanned successfully");
      } else {
        onError("No document was scanned");
      }
    } catch (error) {
      onError("Failed to scan document");
      console.error("Scan error:", error);
    } finally {
      setIsScanning(false);
    }
  };

  return {
    handleScan,
    isScanning,
  };
};
