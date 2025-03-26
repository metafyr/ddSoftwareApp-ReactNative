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

  const handleFileDownload = async (file: File) => {
    try {
      const filename = file.name;
      // Use a more persistent directory for downloaded files
      const directory =
        Platform.OS === "ios"
          ? FileSystem.documentDirectory
          : FileSystem.cacheDirectory;

      const fileUri = directory + filename;

      // Show downloading status
      onDownloadStatus(true, `Downloading ${filename}...`);

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
        }
      );

      const result = await downloadResumable.downloadAsync();

      if (result?.uri) {
        // Make sure file is accessible
        const fileInfo = await FileSystem.getInfoAsync(result.uri);

        if (fileInfo.exists) {
          // Send notification with file info
          await sendNotification(filename, result.uri);

          console.log("File downloaded successfully:", result.uri);
        } else {
          console.error("File exists in result but not found on filesystem");
        }
        onDownloadStatus(true, `File downloaded successfully: ${filename}`);
        onFilePress?.(file);
      }
    } catch (error) {
      onDownloadStatus(false, "Failed to download file. Please try again.");
      console.error("Download error:", error);
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
          {[...files].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((file) => (
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
