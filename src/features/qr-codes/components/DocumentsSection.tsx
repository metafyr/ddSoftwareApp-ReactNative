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
  Progress,
  ProgressFilledTrack,
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  ButtonText,
  VStack,
} from "@/../components/ui";
import {
  InfoIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  DownloadIcon,
  FileIcon,
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
  const [downloadProgress, setDownloadProgress] = useState<{
    filename: string;
    progress: number;
    visible: boolean;
  }>({
    filename: "",
    progress: 0,
    visible: false,
  });

  const showDownloadProgress = (filename: string) => {
    setDownloadProgress({
      filename,
      progress: 0,
      visible: true,
    });
  };

  const hideDownloadProgress = () => {
    setDownloadProgress((prev) => ({
      ...prev,
      visible: false,
    }));
  };

  const updateProgress = (progress: number) => {
    setDownloadProgress((prev) => ({
      ...prev,
      progress,
    }));
  };

  const checkNotificationPermissions = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") {
      const { status: newStatus } =
        await Notifications.requestPermissionsAsync();
      return newStatus === "granted";
    }
    return true;
  };

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
    }
  };

  const openFile = async (fileUri: string, mimeType?: string) => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (!fileInfo.exists) {
        throw new Error("File not found");
      }

      if (Platform.OS === "android") {
        try {
          const contentUri = await FileSystem.getContentUriAsync(fileUri);

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

          const tempFileName = `temp_${Date.now()}_${fileUri.split("/").pop()}`;
          const tempFileUri = `${FileSystem.cacheDirectory}${tempFileName}`;

          await FileSystem.copyAsync({
            from: fileUri,
            to: tempFileUri,
          });

          await Sharing.shareAsync(tempFileUri, {
            mimeType: finalMimeType,
            dialogTitle: "Open File",
          });
        } catch (error) {
          throw new Error(
            `Failed to open file: ${
              error instanceof Error ? error.message : String(error)
            }`
          );
        }
      } else {
        await Sharing.shareAsync(fileUri, {
          mimeType: mimeType,
          dialogTitle: "Open File",
        });
      }
    } catch (error) {
      throw new Error(
        `Failed to open file: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  };

  const handleFileDownload = async (file: File) => {
    try {
      const filename = file.name;
      const directory = FileSystem.documentDirectory;
      const fileUri = `${directory}${filename}`;

      onDownloadStatus(true, `Downloading ${filename}...`);
      showDownloadProgress(filename);

      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (fileInfo.exists) {
        hideDownloadProgress();
        await openFile(fileUri, file.mimeType);
        return;
      }

      const downloadOptions = {
        headers: {},
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
          updateProgress(progress);
        }
      );

      const result = await downloadResumable.downloadAsync();

      if (result?.uri) {
        const downloadedFileInfo = await FileSystem.getInfoAsync(result.uri);

        if (downloadedFileInfo.exists) {
          await sendNotification(filename, result.uri);
          await new Promise((resolve) => setTimeout(resolve, 500));
          hideDownloadProgress();
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
      hideDownloadProgress();
      onDownloadStatus(false, "Failed to download file. Please try again.");
    }
  };

  const getFileIcon = (file: File) => {
    const mimeType = file.mimeType?.toLowerCase() || "";

    if (mimeType.includes("pdf")) {
      return <FileIcon size={20} color="#FF5252" />;
    } else if (mimeType.includes("image")) {
      return <FileIcon size={20} color="#4CAF50" />;
    } else if (mimeType.includes("word") || mimeType.includes("document")) {
      return <FileIcon size={20} color="#2196F3" />;
    } else if (mimeType.includes("excel") || mimeType.includes("sheet")) {
      return <FileIcon size={20} color="#4CAF50" />;
    } else {
      return <FileIcon size={20} color="#757575" />;
    }
  };

  return (
    <Box className="bg-white p-4 rounded-xl">
      <Box className="mb-4">
        <Text className="text-lg font-semibold">{title}</Text>
        <Box className="h-0.5 bg-primary-500 w-1/3 mt-1" />
      </Box>

      {files.length === 0 ? (
        <Box className="py-4 items-center">
          <Text className="text-gray-500">No documents found</Text>
        </Box>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <HStack space="sm" className="pb-2">
            {[...files]
              .sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime()
              )
              .map((file) => (
                <Pressable
                  key={file.id}
                  onPress={() => handleFileDownload(file)}
                >
                  <Box className="bg-background-50 p-3 rounded-lg w-32">
                    <HStack space="xs" className="mb-1">
                      {getFileIcon(file)}
                      <Text className="font-medium flex-1" numberOfLines={1}>
                        {file.name}
                      </Text>
                    </HStack>
                    <Box className="flex-row justify-between items-center">
                      <Text className="text-xs text-gray-500">
                        {new Date(file.createdAt).toLocaleDateString()}
                      </Text>
                      <DownloadIcon size={16} color="#6B7280" />
                    </Box>
                  </Box>
                </Pressable>
              ))}
          </HStack>
        </ScrollView>
      )}

      <Modal
        isOpen={downloadProgress.visible}
        onClose={hideDownloadProgress}
        closeOnOverlayClick={false}
      >
        <ModalBackdrop />
        <ModalContent>
          <ModalHeader>
            <Text>Downloading File</Text>
          </ModalHeader>
          <ModalBody>
            <VStack space="md">
              <Text>{downloadProgress.filename}</Text>
              <Progress value={downloadProgress.progress * 100} size="lg">
                <ProgressFilledTrack />
              </Progress>
              <Text className="text-center">
                {Math.round(downloadProgress.progress * 100)}%
              </Text>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="outline"
              action="secondary"
              onPress={hideDownloadProgress}
            >
              <ButtonText>Cancel</ButtonText>
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default DocumentsSection;
