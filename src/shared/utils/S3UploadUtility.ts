import * as FileSystem from "expo-file-system";

/**
 * Utility for S3 file uploads with fallback mechanism
 */
export const S3UploadUtility = {
  /**
   * Upload a file to S3 with fallback mechanism
   * @param presignedUrl The S3 presigned URL
   * @param fileUri Local URI of the file to upload
   * @param fileType MIME type of the file
   * @returns Object containing success status and information
   */
  async uploadWithFallback(
    presignedUrl: string,
    fileUri: string,
    fileType: string
  ) {
    // Check if the file exists
    const fileInfo = await FileSystem.getInfoAsync(fileUri);

    if (!fileInfo.exists) {
      return {
        success: false,
        error: "File does not exist",
      };
    }

    // Try primary upload method
    try {
      const uploadResult = await FileSystem.uploadAsync(presignedUrl, fileUri, {
        httpMethod: "PUT",
        headers: {
          "Content-Type": fileType,
        },
        uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      });

      return {
        success: uploadResult.status >= 200 && uploadResult.status < 300,
        status: uploadResult.status,
      };
    } catch (primaryError) {
      // If primary method fails, try fallback
      try {
        // Read file as binary data
        const binaryData = await FileSystem.readAsStringAsync(fileUri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const binaryBuffer = Buffer.from(binaryData, "base64");

        // Upload using fetch
        const fetchResponse = await fetch(presignedUrl, {
          method: "PUT",
          headers: {
            "Content-Type": fileType,
            "Content-Length": String(binaryBuffer.length),
          },
          body: binaryBuffer,
        });

        return {
          success: fetchResponse.ok,
          status: fetchResponse.status,
          method: "fallback",
        };
      } catch (fallbackError) {
        return {
          success: false,
          error: "Both upload methods failed",
        };
      }
    }
  },
};
