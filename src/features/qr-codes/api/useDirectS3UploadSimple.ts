import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import * as FileSystem from "expo-file-system";
import { Platform } from "react-native";
import { API_ENDPOINTS } from "@shared/api/endpoints";
import { apiClient } from "@shared/api/client";
import { API_CONFIG, getApiUrl } from "@/config/apiConfig";

// Interface for presigned URL response from backend
interface PresignedUrlResponse {
  uploadUrl: string;
  fileKey: string;
  s3Url: string;
  fileId: string;
}

/**
 * Simple hook for direct S3 uploads using fetch API directly
 * Uses centralized API config for consistent URLs
 */
export const useDirectS3UploadSimple = () => {
  const queryClient = useQueryClient();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const getPresignedUrl = async ({
    fileName,
    fileType,
    fileSize,
    qrCodeId,
    folderId,
    isPublic,
    uploadType,
  }: {
    fileName: string;
    fileType: string;
    fileSize: number;
    qrCodeId: string;
    folderId?: string;
    isPublic?: boolean;
    uploadType?: "scanned" | "uploaded";
  }) => {
    // Sanitize filename
    const sanitizedFileName = fileName
      .replace(/\s+/g, "_")
      .replace(/[()]/g, "")
      .replace(/[^a-zA-Z0-9_.-]/g, "");

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

    // Validate response
    if (!response.fileId) {
      throw new Error("Invalid presigned URL response: missing fileId");
    }

    return response;
  };

  const upload = async ({
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
      setIsLoading(true);
      setError(null);
      setUploadProgress(0);

      // Get presigned URL
      const presignedData = await getPresignedUrl({
        fileName,
        fileType,
        fileSize,
        qrCodeId,
        folderId,
        isPublic,
        uploadType,
      });

      // Presigned URL obtained successfully
      
      let uploadSuccess = false;

      try {
        // Get file info to verify existence
        const fileInfo = await FileSystem.getInfoAsync(fileUri);
        if (!fileInfo.exists) {
          throw new Error("File does not exist");
        }

        // Use the same upload method for both platforms
        const uploadResult = await FileSystem.uploadAsync(
          presignedData.uploadUrl,
          fileUri,
          {
            httpMethod: "PUT",
            headers: {
              "Content-Type": fileType,
            },
            uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
          }
        );

        // S3 upload completed

        if (uploadResult.status < 200 || uploadResult.status >= 300) {
          throw new Error(`Upload to S3 failed with status: ${uploadResult.status}`);
        }

        uploadSuccess = true;

        // Notify backend that upload is complete
        if (uploadSuccess && presignedData.fileId) {
          const completeEndpoint = getApiUrl(
            API_ENDPOINTS.COMPLETE_UPLOAD(presignedData.fileId)
          );

          const completeResponse = await fetch(completeEndpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              success: true,
              size: fileSize,
            }),
          });

          if (!completeResponse.ok) {
            // Silent fail - will be caught by error boundary if critical
          }
        }

        // Invalidate queries to refresh UI
        queryClient.invalidateQueries({
          queryKey: ["files", "qrCode", qrCodeId],
        });
        if (folderId) {
          queryClient.invalidateQueries({
            queryKey: ["files", "folder", folderId],
          });
        }
        queryClient.invalidateQueries({
          queryKey: ["qrCode", "details", qrCodeId],
        });

        setUploadProgress(100);
        return {
          id: presignedData.fileId,
          url: presignedData.s3Url,
        };
      } catch (uploadError) {
        // Error handled in catch block
        
        // If we failed to upload to S3, notify backend to clean up
        if (presignedData.fileId) {
          try {
            const completeEndpoint = getApiUrl(
              API_ENDPOINTS.COMPLETE_UPLOAD(presignedData.fileId)
            );
            // Notify backend of failure
            
            await fetch(completeEndpoint, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
              },
              body: JSON.stringify({
                success: false,
              }),
            });
          } catch (notifyError) {
            // Silently handle notification error
            // Silent failure for notification error
          }
        }

        throw uploadError;
      }
    } catch (error) {
      // Upload error will be shown to user via UI
      setError(error instanceof Error ? error : new Error(String(error)));
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    upload,
    isLoading,
    error,
    progress: uploadProgress,
  };
};
