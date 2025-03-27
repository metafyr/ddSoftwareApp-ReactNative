import React, { useState } from "react";
import {
  Box,
  Text,
  VStack,
  Icon,
  Pressable,
  ScrollView,
  Alert,
  AlertIcon,
  AlertText,
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalBody,
  Progress,
  ProgressFilledTrack,
} from "@/../components/ui";
import {
  ArrowLeft,
  CheckCircleIcon,
  AlertCircleIcon,
} from "lucide-react-native";
import { File, QRCodeDetailsType, Folder } from "@shared/types";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "@shared/types";
import { useQRCodeDetails, useUploadFile } from "../api";
import { QRCodeCard, DocumentsSection, ExpandableFAB } from "../components";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { ScheduleForm } from "@/features/schedules";
import { LoadingScreen, ErrorScreen } from "@/shared/ui";
import { useDocumentScanner } from "@/features/document-scanner";
import { compressImageIfNeeded } from "@shared/utils/fileCompression";
import { useDirectS3UploadSimple } from "../api/useDirectS3UploadSimple";

type QRCodeDetailsRouteProp = RouteProp<RootStackParamList, "QRCodeDetails">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const QRCodeDetailsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<QRCodeDetailsRouteProp>();
  const { qrId, isPhysicalId = false } = route.params;
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [showAlert, setShowAlert] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({ show: false, message: "", type: "success" });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Use the QR code details hook
  const {
    data: qrCode,
    isLoading,
    error,
    refetch,
  } = useQRCodeDetails(qrId, { isPhysicalId });
  const { mutateAsync: uploadFile } = useUploadFile();
  const directS3Upload = useDirectS3UploadSimple();

  const handleBack = () => {
    navigation.goBack();
  };

  const getAllFiles = () => {
    if (!qrCode?.folders) return [];
    const allFiles: File[] = [];
    Object.values(qrCode.folders).forEach((folder: Folder) => {
      allFiles.push(...folder.files);
    });
    return allFiles;
  };

  const getFilesByType = (type: "scanned" | "uploaded") => {
    const allFiles = getAllFiles();
    return allFiles.filter((file) => file.type === type);
  };

  const handleFilePress = (file: File) => {
    // Handle file selection here
  };

  const handleDownloadStatus = (success: boolean, message: string) => {
    setShowAlert({
      show: true,
      message,
      type: success ? "success" : "error",
    });

    // Hide alert after 3 seconds
    setTimeout(() => {
      setShowAlert((prev) => ({ ...prev, show: false }));
    }, 3000);
  };

  const { handleScan, isScanning } = useDocumentScanner({
    qrCodeId: qrId,
    onSuccess: (message) => handleDownloadStatus(true, message),
    onError: (message) => handleDownloadStatus(false, message),
    refetch: refetch,
  });

  const handleUpload = async () => {
    try {
      setIsUploading(true);
      setUploadProgress(0);
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        multiple: true,
      });

      if (result.canceled) {
        return;
      }

      const files = result.assets;
      const totalFiles = files.length;
      let completedFiles = 0;

      const uploadPromises = files.map(async (file) => {
        const mimeType =
          file.mimeType ||
          (file.name.endsWith(".pdf")
            ? "application/pdf"
            : file.name.match(/\.(jpe?g|png|gif|bmp)$/i)
            ? "image/jpeg"
            : "application/octet-stream");

        let fileUri = file.uri;
        let fileSize = file.size || 0;

        if (mimeType.startsWith("image/")) {
          const compressed = await compressImageIfNeeded(file.uri, mimeType);
          fileUri = compressed.uri;
          fileSize = compressed.size;
        } else if (!fileSize) {
          const fileInfo = await FileSystem.getInfoAsync(file.uri);
          fileSize = "size" in fileInfo ? fileInfo.size : 0;
        }

        return directS3Upload
          .upload({
            fileUri,
            fileName: file.name,
            fileType: mimeType,
            fileSize,
            qrCodeId: qrId,
            folderId: undefined,
            isPublic: false,
            uploadType: "uploaded",
          })
          .finally(() => {
            completedFiles++;
            setUploadProgress((completedFiles / totalFiles) * 100);
          });
      });

      try {
        await Promise.all(uploadPromises);
        handleDownloadStatus(true, "Files uploaded successfully");
      } catch (uploadError: any) {
        handleDownloadStatus(
          false,
          `Upload failed: ${uploadError?.message || "Unknown error"}`
        );
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
      await refetch();
    } catch (error: any) {
      handleDownloadStatus(
        false,
        `Error: ${error?.message || "Failed to upload files"}`
      );
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSchedule = () => {
    setShowScheduleForm(true);
  };

  // Show loading screen while data is being fetched
  if (isLoading) {
    return <LoadingScreen message="Loading QR code details..." />;
  }

  // Show error screen if there's an error
  if (error || !qrCode) {
    return (
      <ErrorScreen
        message={
          isPhysicalId
            ? "Failed to find QR code with this physical ID. The QR code might not be registered."
            : "Failed to load QR code details. Please try again."
        }
        onRetry={refetch}
      />
    );
  }

  return (
    <Box className="flex-1 bg-background-50 relative">
      {showScheduleForm ? (
        <ScheduleForm
          onClose={() => setShowScheduleForm(false)}
          qrCodeId={qrId}
        />
      ) : (
        <>
          <ScrollView>
            <Box className="p-4 bg-white border-b border-outline-200">
              <Pressable onPress={handleBack}>
                <Icon as={ArrowLeft} size="md" color="#0F172A" />
              </Pressable>
            </Box>

            <VStack space="md" className="p-4">
              <QRCodeCard
                name={qrCode.name}
                linkedPhysicalQR={qrCode.uuid}
                createdAt={qrCode.createdAt}
              />

              <DocumentsSection
                title="Scanned Documents"
                files={getFilesByType("scanned")}
                onFilePress={handleFilePress}
                onDownloadStatus={handleDownloadStatus}
              />

              <DocumentsSection
                title="Uploaded Documents"
                files={getFilesByType("uploaded")}
                onFilePress={handleFilePress}
                onDownloadStatus={handleDownloadStatus}
              />

              {/* <ScheduleSection schedules={qrCode.schedules} /> */}
            </VStack>
          </ScrollView>

          <ExpandableFAB
            onScanPress={handleScan}
            onUploadPress={handleUpload}
            onSchedulePress={handleSchedule}
            disabled={isScanning || isUploading}
            isLoading={isScanning || isUploading}
          />

          {showAlert.show && (
            <Box className="absolute bottom-4 left-4 right-4">
              <Alert
                action={showAlert.type === "success" ? "success" : "error"}
              >
                <AlertIcon
                  as={
                    showAlert.type === "success"
                      ? CheckCircleIcon
                      : AlertCircleIcon
                  }
                />
                <AlertText>{showAlert.message}</AlertText>
              </Alert>
            </Box>
          )}

          {/* Upload Progress Modal */}
          <Modal
            isOpen={isUploading}
            onClose={() => {}}
            closeOnOverlayClick={false}
          >
            <ModalBackdrop />
            <ModalContent>
              <ModalHeader>
                <Text>Uploading Files</Text>
              </ModalHeader>
              <ModalBody>
                <VStack space="md">
                  <Text>Please wait while files are being uploaded...</Text>
                  <Progress value={uploadProgress} size="lg">
                    <ProgressFilledTrack />
                  </Progress>
                  <Text className="text-center">
                    {Math.round(uploadProgress)}%
                  </Text>
                </VStack>
              </ModalBody>
            </ModalContent>
          </Modal>
        </>
      )}
    </Box>
  );
};

export default QRCodeDetailsScreen;
