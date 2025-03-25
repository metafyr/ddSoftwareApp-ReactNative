import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { Platform } from "react-native";
import * as FileSystem from "expo-file-system";
import { useUploadFile } from "@features/qr-codes";

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
  const { mutateAsync: uploadFile } = useUploadFile();

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
        quality: 0.5, // Reduce quality to decrease file size
        allowsEditing: false, // Disable editing to prevent potential URI issues
        base64: false,
        exif: false,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const fileUri = asset.uri;

        // Add detailed logging about the URI
        console.log("[DocumentScanner] Original captured image URI:", fileUri);
        console.log("[DocumentScanner] Platform:", Platform.OS);

        try {
          // Check if the file exists
          const fileInfo = await FileSystem.getInfoAsync(fileUri);
          console.log("[DocumentScanner] Original file info:", fileInfo);

          if (!fileInfo.exists) {
            throw new Error("File does not exist at the provided URI");
          }

          // Process the image using ImageManipulator for better compatibility
          console.log("[DocumentScanner] Processing image...");

          // Compress and resize the image to reduce file size
          const manipResult = await ImageManipulator.manipulateAsync(
            fileUri,
            [{ resize: { width: 1200 } }], // Resize to 1200px width max
            {
              compress: 0.6, // Compression level
              format: ImageManipulator.SaveFormat.JPEG,
            }
          );

          console.log("[DocumentScanner] Image processed:", manipResult.uri);

          // Generate a unique filename based on timestamp
          const timestamp = new Date().getTime();
          const fileName = `scanned_${timestamp}.jpg`;
          console.log("[DocumentScanner] Generated filename:", fileName);

          // For Android specifically, check the file size after manipulation
          if (Platform.OS === "android") {
            const processedInfo = await FileSystem.getInfoAsync(
              manipResult.uri
            );
            console.log(
              "[DocumentScanner] Processed file info:",
              processedInfo
            );

            if (processedInfo.exists && "size" in processedInfo) {
              console.log(
                "[DocumentScanner] Processed file size:",
                processedInfo.size,
                "bytes"
              );

              // If still too large, compress more aggressively
              if (processedInfo.size > 1500000) {
                // If larger than 1.5MB
                console.log(
                  "[DocumentScanner] File still large, compressing more..."
                );
                const recompressResult = await ImageManipulator.manipulateAsync(
                  manipResult.uri,
                  [{ resize: { width: 800 } }], // Smaller size
                  {
                    compress: 0.4, // Higher compression
                    format: ImageManipulator.SaveFormat.JPEG,
                  }
                );

                console.log(
                  "[DocumentScanner] Recompressed image:",
                  recompressResult.uri
                );

                // Now use this more compressed image
                const finalFileInfo = await FileSystem.getInfoAsync(
                  recompressResult.uri
                );
                if (finalFileInfo.exists && "size" in finalFileInfo) {
                  console.log(
                    "[DocumentScanner] Final file size:",
                    finalFileInfo.size,
                    "bytes"
                  );
                }

                // Upload the processed image
                console.log("[DocumentScanner] Starting upload...");
                await uploadFile({
                  fileUri: recompressResult.uri,
                  fileName,
                  fileType: "image/jpeg",
                  qrCodeId,
                  folderId: undefined,
                  isPublic: false,
                  uploadType: "scanned",
                });
              } else {
                // Use the first compressed image if size is acceptable
                console.log(
                  "[DocumentScanner] Starting upload with normal compression..."
                );
                await uploadFile({
                  fileUri: manipResult.uri,
                  fileName,
                  fileType: "image/jpeg",
                  qrCodeId,
                  folderId: undefined,
                  isPublic: false,
                  uploadType: "scanned",
                });
              }
            } else {
              // Fallback to using the manipulated image directly
              await uploadFile({
                fileUri: manipResult.uri,
                fileName,
                fileType: "image/jpeg",
                qrCodeId,
                folderId: undefined,
                isPublic: false,
                uploadType: "scanned",
              });
            }
          } else {
            // For iOS, use the manipulated image directly
            await uploadFile({
              fileUri: manipResult.uri,
              fileName,
              fileType: "image/jpeg",
              qrCodeId,
              folderId: undefined,
              isPublic: false,
              uploadType: "scanned",
            });
          }

          console.log("[DocumentScanner] Upload completed successfully");
          onSuccess("Document scanned and uploaded successfully");

          if (refetch) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            await refetch();
          }
        } catch (error) {
          console.error("[DocumentScanner] Processing/upload error:", error);
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
      // Enhanced error reporting
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("[DocumentScanner] Scan error:", error);
      console.error(
        "[DocumentScanner] Stack trace:",
        error instanceof Error ? error.stack : "No stack trace"
      );
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
