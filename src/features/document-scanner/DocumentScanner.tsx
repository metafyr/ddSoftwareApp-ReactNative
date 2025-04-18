import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { Platform } from "react-native";
import * as FileSystem from "expo-file-system";
import { useDirectS3UploadSimple } from "@features/qr-codes/api/useDirectS3UploadSimple";
import { useAuth } from "@features/auth/api/useAuth";

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
  const { data: user } = useAuth();

  const handleScan = async () => {
    try {
      // Check if already scanning
      if (isScanning) {
        console.log("Document scanning already in progress");
        return;
      }

      console.log("Starting document scan process");
      setIsScanning(true);

      // Request camera permission with retry logic
      console.log("Requesting camera permissions");
      let permissionStatus;
      try {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        permissionStatus = status;
        console.log("Camera permission status:", status);

        if (status !== "granted") {
          console.error("Camera permission denied:", status);
          onError("Camera permission is required to scan documents");
          return;
        }
      } catch (permissionError: any) {
        console.error("Error requesting camera permissions:", permissionError);
        console.error("Permission error details:", {
          name: permissionError?.name,
          message: permissionError?.message,
          stack: permissionError?.stack,
          platform: Platform.OS,
          version: Platform.Version,
        });
        onError("Failed to request camera permissions");
        return;
      }

      // Ensure we're on the main thread and the app is active
      if (Platform.OS === "android") {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      console.log("Launching camera with options:", {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.5,
        allowsEditing: false,
        base64: false,
        exif: false,
        presentationStyle:
          Platform.OS === "ios"
            ? ImagePicker.UIImagePickerPresentationStyle.FULL_SCREEN
            : undefined,
      });

      // Launch camera with retry logic
      let result: ImagePicker.ImagePickerResult | undefined;
      let retryCount = 0;
      const maxRetries = 2;

      while (retryCount <= maxRetries) {
        try {
          result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.5,
            allowsEditing: false,
            base64: false,
            exif: false,
            presentationStyle:
              Platform.OS === "ios"
                ? ImagePicker.UIImagePickerPresentationStyle.FULL_SCREEN
                : undefined,
          });
          break; // If successful, break the retry loop
        } catch (cameraError: any) {
          console.error(
            `Camera launch attempt ${retryCount + 1} failed:`,
            cameraError
          );
          console.error("Camera error details:", {
            name: cameraError?.name,
            message: cameraError?.message,
            stack: cameraError?.stack,
            platform: Platform.OS,
            version: Platform.Version,
          });

          if (retryCount === maxRetries) {
            onError("Failed to open camera. Please try again.");
            return;
          }

          // Wait before retrying
          await new Promise((resolve) => setTimeout(resolve, 500));
          retryCount++;
        }
      }

      // Check if result is defined before proceeding
      if (!result) {
        console.error("Camera result is undefined");
        onError("Failed to capture image. Please try again.");
        return;
      }

      console.log(
        "Camera result:",
        result.canceled ? "Canceled" : "Photo taken"
      );

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const fileUri = asset.uri;
        console.log("Photo captured successfully, URI:", fileUri);

        try {
          // Check if the file exists
          console.log("Checking if file exists at URI:", fileUri);
          const fileInfo = await FileSystem.getInfoAsync(fileUri);
          console.log("File info:", fileInfo);

          if (!fileInfo.exists) {
            console.error("File does not exist at URI:", fileUri);
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

          // Ensure we have the organization ID
          if (!user?.organizationId) {
            throw new Error("Organization ID is required for document upload");
          }

          // Ensure we have a valid user ID (UUID format)
          const validUserId =
            user.id &&
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
              user.id
            )
              ? user.id
              : "00000000-0000-0000-0000-000000000000";

          // Use direct S3 upload for the scanned document
          await directS3Upload.upload({
            fileUri: processedFileUri,
            fileName,
            fileType: "image/jpeg",
            fileSize,
            qrCodeId,
            orgId: user.organizationId, // Include required organization ID
            folderId: undefined,
            isPublic: false,
            uploadType: "scanned",
            userId: validUserId, // Use the validated UUID
          });

          onSuccess("Document scanned and uploaded successfully");

          if (refetch) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            await refetch();
          }
        } catch (error) {
          if (
            error instanceof Error &&
            error.message.includes("Organization ID is required")
          ) {
            onError(
              "Your organization information is missing. Please try logging in again."
            );
          } else {
            onError(
              `Failed to process or upload document: ${
                error instanceof Error ? error.message : String(error)
              }`
            );
          }
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
