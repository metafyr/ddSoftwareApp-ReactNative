import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { Platform } from "react-native";
import * as FileSystem from "expo-file-system";
import { useDirectS3UploadSimple } from "@features/qr-codes/api/useDirectS3UploadSimple";

interface DocumentScannerProps {
  qrCodeId: string;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  refetch?: () => Promise<any>;
}

export const useDocumentScanner = ({
  qrCodeId,
  onSuccess,
  onError,
  refetch,
}: DocumentScannerProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const directS3Upload = useDirectS3UploadSimple();

  const handleScan = async () => {
    try {
      setIsScanning(true);

      // Request camera permission
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        onError("Camera permission is required to scan documents");
        return;
      }

      // Launch camera with reduced quality
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.5,
        allowsEditing: false,
        base64: false,
        exif: false,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const fileUri = asset.uri;

        try {
          // Check if the file exists
          const fileInfo = await FileSystem.getInfoAsync(fileUri);
          if (!fileInfo.exists) {
            throw new Error("File does not exist at the provided URI");
          }

          // Process the image using ImageManipulator for better compatibility
          const manipResult = await ImageManipulator.manipulateAsync(
            fileUri,
            [{ resize: { width: 1200 } }],
            {
              compress: 0.6,
              format: ImageManipulator.SaveFormat.JPEG,
            }
          );

          // Generate a unique filename based on timestamp
          const timestamp = new Date().getTime();
          const fileName = `scanned_${timestamp}.jpg`;

          // Get file info after processing
          let processedFileUri = manipResult.uri;
          let fileSize = 0;

          // Get the file size after manipulation
          const processedInfo = await FileSystem.getInfoAsync(processedFileUri);

          if (processedInfo.exists && "size" in processedInfo) {
            fileSize = processedInfo.size;

            // If still too large, compress more aggressively
            if (fileSize > 1500000) {
              const recompressResult = await ImageManipulator.manipulateAsync(
                manipResult.uri,
                [{ resize: { width: 800 } }],
                {
                  compress: 0.4,
                  format: ImageManipulator.SaveFormat.JPEG,
                }
              );

              processedFileUri = recompressResult.uri;
              const finalFileInfo = await FileSystem.getInfoAsync(
                processedFileUri
              );

              if (finalFileInfo.exists && "size" in finalFileInfo) {
                fileSize = finalFileInfo.size;
              }
            }
          }

          // Use direct S3 upload for the scanned document
          await directS3Upload.upload({
            fileUri: processedFileUri,
            fileName,
            fileType: "image/jpeg",
            fileSize,
            qrCodeId,
            folderId: undefined,
            isPublic: false,
            uploadType: "scanned",
          });

          onSuccess("Document scanned and uploaded successfully");

          if (refetch) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            await refetch();
          }
        } catch (error) {
          onError(
            `Failed to process or upload document: ${
              error instanceof Error ? error.message : String(error)
            }`
          );
        }
      } else {
        onError("No document was scanned");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      onError(`Failed to scan document: ${errorMessage}`);
    } finally {
      setIsScanning(false);
    }
  };

  return {
    handleScan,
    isScanning,
  };
};
