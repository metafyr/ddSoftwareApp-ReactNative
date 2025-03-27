import * as FileSystem from "expo-file-system";
import * as ImageManipulator from "expo-image-manipulator";

interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

/**
 * Compresses an image file if it's above a certain size threshold
 * @param fileUri URI of the file to compress
 * @param fileType MIME type of the file
 * @param options Compression options
 * @returns Object containing the URI of the compressed file and its size
 */
export async function compressImageIfNeeded(
  fileUri: string,
  fileType: string,
  options: CompressionOptions = {}
): Promise<{ uri: string; size: number }> {
  try {
    // If not an image type, return the original
    if (!fileType.startsWith("image/") || fileType === "image/gif") {
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      return { uri: fileUri, size: "size" in fileInfo ? fileInfo.size : 0 };
    }

    // Get file info to check size
    const fileInfo = await FileSystem.getInfoAsync(fileUri);

    // Skip compression for small files (under 1MB by default)
    const SIZE_THRESHOLD = 1 * 1024 * 1024; // 1MB
    if (
      !fileInfo.exists ||
      !("size" in fileInfo) ||
      fileInfo.size < SIZE_THRESHOLD
    ) {
      return { uri: fileUri, size: "size" in fileInfo ? fileInfo.size : 0 };
    }

    // Default compression options
    const defaultOptions = {
      maxWidth: 1920,
      maxHeight: 1920,
      quality: 0.8,
    };

    // Merge with provided options
    const compressionOptions = { ...defaultOptions, ...options };

    // Perform image compression
    const result = await ImageManipulator.manipulateAsync(
      fileUri,
      [
        {
          resize: {
            width: compressionOptions.maxWidth,
            height: compressionOptions.maxHeight,
          },
        },
      ],
      {
        compress: compressionOptions.quality,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );

    // Get compressed file size
    const compressedFileInfo = await FileSystem.getInfoAsync(result.uri);

    // If compression didn't reduce size, return original
    if (
      "size" in fileInfo &&
      "size" in compressedFileInfo &&
      compressedFileInfo.size >= fileInfo.size
    ) {
      return { uri: fileUri, size: fileInfo.size };
    }

    return {
      uri: result.uri,
      size: "size" in compressedFileInfo ? compressedFileInfo.size : 0,
    };
  } catch (error) {
    // If compression fails, return the original file
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    return { uri: fileUri, size: "size" in fileInfo ? fileInfo.size : 0 };
  }
}
