import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import * as FileSystem from "expo-file-system";
import { API_ENDPOINTS } from "@shared/api/endpoints";
import { apiClient } from "@shared/api/client";
import { sanitizeFileName, getValidatedUuid } from "@shared/utils/fileUtils";

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

  /**
   * Get a presigned URL for direct S3 upload
   * Includes special handling for mobile uploads
   */
  const getPresignedUrl = async ({
    fileName,
    fileType,
    fileSize,
    qrCodeId,
    orgId,
    folderId,
    isPublic,
    uploadType,
    userId,
  }: {
    fileName: string;
    fileType: string;
    fileSize: number;
    qrCodeId: string;
    orgId: string;
    folderId?: string;
    isPublic?: boolean;
    uploadType?: "scanned" | "uploaded";
    userId?: string;
  }) => {
    // Sanitize filename for storage but keep original for Content-Disposition
    const sanitizedFileName = sanitizeFileName(fileName);

    // Request a mobile-friendly presigned URL
    const response = await apiClient.request<PresignedUrlResponse>(
      API_ENDPOINTS.PRESIGNED_UPLOAD,
      {
        method: "POST",
        body: {
          fileName: sanitizedFileName,
          fileType,
          fileSize,
          qrCodeId,
          orgId,
          folderId,
          isPublic,
          uploadType,
          userId: getValidatedUuid(userId),
          // Mobile-specific settings
          isMobileUpload: true,
          includeContentType: true,
          minimizeSignedHeaders: true,
        },
      }
    );

    // Validate response
    if (!response.fileId) {
      throw new Error("Invalid presigned URL response: missing fileId");
    }

    return response;
  };

  /**
   * Upload a file directly to S3 using presigned URL
   * Uses multiple methods for compatibility across different React Native environments
   */
  const upload = async ({
    fileUri,
    fileName,
    fileType,
    fileSize,
    qrCodeId,
    orgId,
    folderId,
    isPublic = false,
    uploadType = "uploaded",
    userId,
  }: {
    fileUri: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    qrCodeId: string;
    orgId: string;
    folderId?: string;
    isPublic?: boolean;
    uploadType?: "scanned" | "uploaded";
    userId?: string;
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
        orgId,
        folderId,
        isPublic,
        uploadType,
        userId,
      });

      // Presigned URL obtained successfully
      let uploadSuccess = false;
      let uploadResult = null;

      try {
        // Verify file exists
        const fileInfo = await FileSystem.getInfoAsync(fileUri);
        if (!fileInfo.exists) {
          throw new Error(`File doesn't exist at path: ${fileUri}`);
        }

        // Create minimal headers for S3
        const requestHeaders: Record<string, string> = {
          "Content-Type": fileType,
          "Content-Disposition": `attachment; filename="${encodeURIComponent(
            fileName
          )}"`,
          "Cache-Control": "max-age=31536000",
        };

        // Primary method: Direct fetch upload with binary data
        try {
          // Read file as base64
          const fileBase64 = await FileSystem.readAsStringAsync(fileUri, {
            encoding: FileSystem.EncodingType.Base64,
          });

          // Convert base64 to binary array
          const binaryString = atob(fileBase64);
          const len = binaryString.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          // Use fetch API with binary data
          const fetchResponse = await fetch(presignedData.uploadUrl, {
            method: "PUT",
            headers: requestHeaders,
            body: bytes,
          });

          if (fetchResponse.status >= 200 && fetchResponse.status < 300) {
            uploadSuccess = true;
            uploadResult = {
              id: presignedData.fileId,
              url: presignedData.s3Url,
            };
          } else {
            const errorText = await fetchResponse.text();
            throw new Error(
              `Upload failed with status: ${fetchResponse.status}`
            );
          }
        } catch (primaryError) {
          // Fallback: Try with FileSystem.uploadAsync
          const simpleHeaders = {
            "Content-Type": fileType,
          };

          const response = await FileSystem.uploadAsync(
            presignedData.uploadUrl,
            fileUri,
            {
              httpMethod: "PUT",
              headers: simpleHeaders,
              uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
            }
          );

          if (response.status >= 200 && response.status < 300) {
            uploadSuccess = true;
            uploadResult = {
              id: presignedData.fileId,
              url: presignedData.s3Url,
            };
          } else {
            throw new Error(
              `Fallback upload failed with status: ${response.status}`
            );
          }
        }

        // Notify backend that upload is complete
        try {
          const completeEndpoint = API_ENDPOINTS.COMPLETE_UPLOAD(
            presignedData.fileId
          );

          await apiClient.request(completeEndpoint, {
            method: "POST",
            body: {
              success: uploadSuccess,
              size: uploadSuccess ? fileSize : 0,
              fileId: presignedData.fileId,
            },
          });

          // Invalidate queries to refresh UI if upload was successful
          if (uploadSuccess) {
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
          }
        } catch (notifyError) {
          // Just log the error but don't fail the upload if notification fails
          console.error("Error notifying upload status:", notifyError);
        }

        return (
          uploadResult || {
            id: presignedData.fileId,
            url: presignedData.s3Url,
          }
        );
      } catch (uploadError) {
        // If we failed to upload to S3, notify backend to clean up
        if (presignedData.fileId) {
          try {
            const completeEndpoint = API_ENDPOINTS.COMPLETE_UPLOAD(
              presignedData.fileId
            );

            await apiClient.request(completeEndpoint, {
              method: "POST",
              body: {
                success: false,
                fileId: presignedData.fileId,
              },
            });
          } catch (notifyError) {
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
