import React, { useState } from "react";
import {
  Box,
  Text,
  HStack,
  ScrollView,
  Pressable,
  Alert,
  AlertIcon,
  AlertText,
} from "@/../components/ui";
import {
  InfoIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  DownloadIcon,
} from "lucide-react-native";
import { File } from "@shared/types";
import * as FileSystem from "expo-file-system";
import * as Notifications from "expo-notifications";
import * as Sharing from "expo-sharing";
import * as Linking from "expo-linking";
import { Platform } from "react-native";

interface DocumentsSectionProps {
  title: string;
  files: File[];
  onFilePress?: (file: File) => void;
  onDownloadStatus: (success: boolean, message: string) => void;
}

export const DocumentsSection = ({
  title,
  files,
  onFilePress,
  onDownloadStatus,
}: DocumentsSectionProps) => {
  // Check for notification permissions
  const checkNotificationPermissions = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") {
      const { status: newStatus } =
        await Notifications.requestPermissionsAsync();
      return newStatus === "granted";
    }
    return true;
  };

  // Send notification with downloaded file info
  const sendNotification = async (filename: string, fileUri: string) => {
    const hasPermission = await checkNotificationPermissions();

    if (hasPermission) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Download Complete!",
          body: `File ${filename} downloaded successfully. Tap to open.`,
          data: { url: fileUri },
          sound: "default",
        },
        trigger: null,
      });
      console.log("Notification scheduled for file:", filename);
    } else {
      console.log("Notification permission not granted");
    }
  };

  // Function to open a file
  const openFile = async (fileUri: string, mimeType?: string) => {
    try {
      // First verify the file exists
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (!fileInfo.exists) {
        throw new Error("File not found");
      }

      // For Android, we need to handle file opening differently
      if (Platform.OS === "android") {
        try {
          // Get the content URI
          const contentUri = await FileSystem.getContentUriAsync(fileUri);
          console.log("Content URI:", contentUri);

          // Determine the correct MIME type if not provided
          let finalMimeType = mimeType;
          if (!finalMimeType) {
            const extension = fileUri.split(".").pop()?.toLowerCase();
            switch (extension) {
              case "jpg":
              case "jpeg":
                finalMimeType = "image/jpeg";
                break;
              case "png":
                finalMimeType = "image/png";
                break;
              case "pdf":
                finalMimeType = "application/pdf";
                break;
              default:
                finalMimeType = "application/octet-stream";
            }
          }

          // Create a temporary file in the cache directory
          const tempFileName = `temp_${Date.now()}_${fileUri.split("/").pop()}`;
          const tempFileUri = `${FileSystem.cacheDirectory}${tempFileName}`;

          // Copy the file to the cache directory
          await FileSystem.copyAsync({
            from: fileUri,
            to: tempFileUri,
          });

          // Share the temporary file
          await Sharing.shareAsync(tempFileUri, {
            mimeType: finalMimeType,
            dialogTitle: "Open File",
          });

          // Clean up the temporary file after a delay
          setTimeout(async () => {
            try {
              await FileSystem.deleteAsync(tempFileUri);
            } catch (error) {
              console.error("Error cleaning up temp file:", error);
            }
          }, 1000);

          return;
        } catch (error) {
          console.error("Error opening file with content URI:", error);
        }
      }

      // For iOS or if Android content URI fails, try direct file URI
      const supported = await Linking.canOpenURL(fileUri);
      if (supported) {
        await Linking.openURL(fileUri);
      } else {
        throw new Error("Cannot open this file type");
      }
    } catch (error) {
      console.error("Error opening file:", error);
      throw error;
    }
  };

  const handleFileDownload = async (file: File) => {
    try {
      const filename = file.name;
      // Use document directory for persistent storage
      const directory = FileSystem.documentDirectory;
      const fileUri = `${directory}${filename}`;

      // Show downloading status
      onDownloadStatus(true, `Downloading ${filename}...`);

      // Check if file already exists
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (fileInfo.exists) {
        console.log("File already exists, opening...");
        await openFile(fileUri, file.mimeType);
        return;
      }

      // Create download options with Android notification configuration
      const downloadOptions = {
        headers: {},
        // Add Android download notification configuration
        android: {
          notification: {
            enabled: true,
            title: filename,
            description: "Downloading file...",
            completionTitle: "Download complete",
            completionDescription: "File downloaded successfully",
          },
        },
      };

      const downloadResumable = FileSystem.createDownloadResumable(
        file.url,
        fileUri,
        downloadOptions as FileSystem.DownloadOptions,
        (downloadProgress) => {
          const progress =
            downloadProgress.totalBytesWritten /
            downloadProgress.totalBytesExpectedToWrite;
          console.log(`Download progress: ${Math.round(progress * 100)}%`);
        }
      );

      const result = await downloadResumable.downloadAsync();

      if (result?.uri) {
        // Make sure file is accessible
        const downloadedFileInfo = await FileSystem.getInfoAsync(result.uri);
        console.log("Downloaded file info:", downloadedFileInfo);

        if (downloadedFileInfo.exists) {
          // Send notification with file info
          await sendNotification(filename, result.uri);

          console.log("File downloaded successfully:", result.uri);

          // Wait a short moment to ensure file is fully written
          await new Promise((resolve) => setTimeout(resolve, 500));

          // Open the file after successful download
          await openFile(result.uri, file.mimeType);

          onDownloadStatus(true, `File downloaded successfully: ${filename}`);
          onFilePress?.(file);
        } else {
          throw new Error("File exists in result but not found on filesystem");
        }
      } else {
        throw new Error("Download completed but no URI returned");
      }
    } catch (error) {
      console.error("Download error:", error);
      onDownloadStatus(false, "Failed to download file. Please try again.");
    }
  };

  return (
    <Box className="bg-white p-4 rounded-xl">
      <Box className="mb-4">
        <Text className="text-lg font-semibold">{title}</Text>
        <Box className="h-0.5 bg-primary-500 w-1/3 mt-1" />
      </Box>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <HStack space="sm" className="pb-2">
          {[...files]
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            )
            .map((file) => (
              <Pressable key={file.id} onPress={() => handleFileDownload(file)}>
                <Box className="bg-background-50 p-3 rounded-lg w-32">
                  <Text className="font-medium" numberOfLines={1}>
                    {file.name}
                  </Text>
                  <Box className="flex-row justify-between items-center">
                    <Text className="text-sm text-gray-500">
                      {new Date(file.createdAt).toLocaleDateString()}
                    </Text>
                    <DownloadIcon size={16} color="#6B7280" />
                  </Box>
                </Box>
              </Pressable>
            ))}
        </HStack>
      </ScrollView>
    </Box>
  );
};

export default DocumentsSection;
