import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@shared/api/client";
import { API_ENDPOINTS } from "@shared/api/endpoints";
import { File } from "@shared/types";
import * as FileSystem from "expo-file-system";
import { Platform } from "react-native";

interface PresignedUrlResponse {
  uploadUrl: string;
  fileKey: string;
  s3Url: string;
  fileId: string;
}

/**
 * Hook for direct-to-S3 file uploads
 * This approach bypasses the backend for large file uploads
 */
export const useDirectS3Upload = () => {
  const queryClient = useQueryClient();
  const [uploadProgress, setUploadProgress] = useState(0);

  // Step 1: Get a pre-signed URL from our backend
  const getPresignedUrl = useMutation({
    mutationFn: async ({
      fileName,
      fileType,
      fileSize,
      qrCodeId,
      folderId,
      isPublic = false,
      uploadType = "uploaded",
    }: {
      fileName: string;
      fileType: string;
      fileSize: number;
      qrCodeId: string;
      folderId?: string;
      isPublic?: boolean;
      uploadType?: "scanned" | "uploaded";
    }) => {
      // Sanitize filename to remove problematic characters
      const sanitizedFileName = fileName
        .replace(/\s+/g, "_") // Replace spaces with underscores
        .replace(/[()]/g, "") // Remove parentheses
        .replace(/[^a-zA-Z0-9_.-]/g, ""); // Remove other special characters

      // Generate pre-signed URL
      const response = await apiClient.request<PresignedUrlResponse>(
        API_ENDPOINTS.PRESIGNED_UPLOAD,
        {
          method: "POST",
          body: {
            fileName: sanitizedFileName,
            fileType,
            fileSize,
            qrCodeId,
            folderId,
            isPublic,
            uploadType,
          },
        }
      );

      return response;
    },
  });

  // Step 2: Upload the file directly to S3
  const uploadToS3 = useMutation({
    mutationFn: async ({
      fileUri,
      presignedData,
    }: {
      fileUri: string;
      presignedData: PresignedUrlResponse;
    }) => {
      try {
        // Format URI based on platform
        let formattedUri = fileUri;
        if (Platform.OS === "ios") {
          // For iOS, we remove the file:// prefix
          formattedUri = fileUri.replace("file://", "");
        }

        // Get file info
        const fileInfo = await FileSystem.getInfoAsync(fileUri);
        if (!fileInfo.exists) {
          throw new Error("File does not exist");
        }

        if (Platform.OS === "android") {
          // For Android, use the fetch API directly
          const contentUriMatch = fileUri.match(/^content:\/\/(.*)$/);

          if (contentUriMatch) {
            console.log("Using content URI approach");
            // Use the file directly if it's a content URI
            const response = await fetch(presignedData.uploadUrl, {
              method: "PUT",
              headers: {
                "Content-Type": presignedData.fileType,
              },
              body: await FileSystem.readAsStringAsync(fileUri),
            });

            if (!response.ok) {
              throw new Error(`Upload failed with status: ${response.status}`);
            }
          } else {
            console.log("Using file URI approach");
            // Convert file to base64 for non-content URIs
            const base64Content = await FileSystem.readAsStringAsync(fileUri, {
              encoding: FileSystem.EncodingType.Base64,
            });

            // Create a blob and send it
            const blob = await (await fetch(`data:${presignedData.fileType};base64,${base64Content}`)).blob();
            
            const response = await fetch(presignedData.uploadUrl, {
              method: "PUT",
              headers: {
                "Content-Type": presignedData.fileType,
              },
              body: blob,
            });

            if (!response.ok) {
              throw new Error(`Upload failed with status: ${response.status}`);
            }
          }
        } else {
          // For iOS, use Expo's uploadAsync (which works better on iOS)
          const uploadOptions: FileSystem.FileSystemUploadOptions = {
            httpMethod: "PUT",
            headers: {
              "Content-Type": presignedData.fileType,
            },
            uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
          };

          // Use Expo's uploadAsync for better progress tracking
          const uploadResult = await FileSystem.uploadAsync(
            presignedData.uploadUrl,
            fileUri,
            uploadOptions
          );

          if (uploadResult.status < 200 || uploadResult.status >= 300) {
            throw new Error(`Upload failed with status: ${uploadResult.status}`);
          }
        }

        // Notify backend that upload is complete
        await apiClient.request(
          API_ENDPOINTS.COMPLETE_UPLOAD(presignedData.fileId),
          {
            method: "POST",
            body: {
              success: true,
              size: fileInfo.size,
            },
          }
        );

        return {
          id: presignedData.fileId,
          url: presignedData.s3Url,
        };
      } catch (error) {
        console.error("Error uploading to S3:", error);

        // Notify backend that upload failed
        try {
          await apiClient.request(
            API_ENDPOINTS.COMPLETE_UPLOAD(presignedData.fileId),
            {
              method: "POST",
              body: {
                success: false,
              },
            }
          );
        } catch (notifyError) {
          console.error("Failed to notify backend of upload failure", notifyError);
        }

        throw error;
      }
    },
    onSuccess: (data, variables) => {
      // Invalidate relevant queries to refetch the file list
      if (variables.presignedData) {
        queryClient.invalidateQueries({
          queryKey: ["files", "qrCode", variables.presignedData.qrCodeId],
        });

        if (variables.presignedData.folderId) {
          queryClient.invalidateQueries({
            queryKey: ["files", "folder", variables.presignedData.folderId],
          });
        }

        // Also invalidate QR code details
        queryClient.invalidateQueries({
          queryKey: ["qrCode", "details", variables.presignedData.qrCodeId],
        });
      }
    },
  });

  // Main function that handles the entire upload process
  const mutateAsync = async ({
    fileUri,
    fileName,
    fileType,
    fileSize,
    qrCodeId,
    folderId,
    isPublic = false,
    uploadType = "uploaded",
  }: {
    fileUri: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    qrCodeId: string;
    folderId?: string;
    isPublic?: boolean;
    uploadType?: "scanned" | "uploaded";
  }) => {
    try {
      // Reset progress
      setUploadProgress(0);

      // Step 1: Get presigned URL
      const presignedData = await getPresignedUrl.mutateAsync({
        fileName,
        fileType,
        fileSize,
        qrCodeId,
        folderId,
        isPublic,
        uploadType,
      });

      // Step 2: Upload file directly to S3
      const result = await uploadToS3.mutateAsync({
        fileUri,
        presignedData,
      });

      return result;
    } catch (error) {
      console.error("Direct S3 upload failed:", error);
      throw error;
    }
  };

  return {
    mutateAsync,
    isLoading: getPresignedUrl.isLoading || uploadToS3.isLoading,
    error: getPresignedUrl.error || uploadToS3.error,
    progress: uploadProgress,
  };
};
