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
} from "../../components/ui";
import {
  InfoIcon,
  CheckCircleIcon,
  AlertCircleIcon,
} from "lucide-react-native";
import { File } from "../../types";
import * as FileSystem from "expo-file-system";

interface DocumentsSectionProps {
  title: string;
  files: File[];
  onFilePress?: (file: File) => void;
  onDownloadStatus: (success: boolean, message: string) => void;
}

const DocumentsSection = ({
  title,
  files,
  onFilePress,
  onDownloadStatus,
}: DocumentsSectionProps) => {
  const handleFileDownload = async (file: File) => {
    try {
      const filename = file.name;
      const fileUri = FileSystem.documentDirectory + filename;

      const downloadResumable = FileSystem.createDownloadResumable(
        file.url,
        fileUri,
        {},
        (downloadProgress) => {
          const progress =
            downloadProgress.totalBytesWritten /
            downloadProgress.totalBytesExpectedToWrite;
        }
      );

      const result = await downloadResumable.downloadAsync();

      if (result?.uri) {
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
      <Text className="text-lg font-semibold mb-4">{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <HStack space="sm" className="pb-2">
          {files.map((file) => (
            <Pressable key={file.id} onPress={() => handleFileDownload(file)}>
              <Box className="bg-background-50 p-3 rounded-lg w-32">
                <Text className="font-medium" numberOfLines={1}>
                  {file.name}
                </Text>
                <Text className="text-sm text-gray-500">
                  {new Date(file.createdAt).toLocaleDateString()}
                </Text>
              </Box>
            </Pressable>
          ))}
        </HStack>
      </ScrollView>
    </Box>
  );
};

export default DocumentsSection;
