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
} from "../../components/ui";
import {
  ArrowLeft,
  CheckCircleIcon,
  AlertCircleIcon,
} from "lucide-react-native";
import { File, QRCodeDetailsType, Folder } from "../../types";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import QRCodeCard from "../components/QRCodeCard";
import DocumentsSection from "../components/DocumentsSection";
import ExpandableFAB from "../components/ExpandableFAB";
import ScheduleSection from "../components/ScheduleSection";
import ScheduleForm from "../components/ScheduleForm";
import { useDocumentScanner } from "@/features/document-scanner/DocumentScanner";
import * as DocumentPicker from "expo-document-picker";
import { useQRCodeDetails, useUploadFile } from "../../src/api/hooks";
import LoadingScreen from "../../src/screens/LoadingScreen";
import ErrorScreen from "../../src/screens/ErrorScreen";
import { RootStackParamList } from "@/src/types/index";

type QRCodeDetailsRouteProp = RouteProp<RootStackParamList, "QRCodeDetails">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const QRCodeDetails = () => {
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

  // Use the QR code details hook
  const {
    data: qrCode,
    isLoading,
    error,
    refetch,
  } = useQRCodeDetails(qrId, { isPhysicalId });
  const { mutateAsync: uploadFile } = useUploadFile();

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
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        multiple: true,
      });

      if (result.canceled) {
        return;
      }

      // Handle successful file selection
      const files = result.assets;

      // Upload each file
      const uploadPromises = files.map(async (file) => {
        // Ensure we have a valid mime type
        const mimeType =
          file.mimeType ||
          (file.name.endsWith(".pdf")
            ? "application/pdf"
            : file.name.match(/\.(jpe?g|png|gif|bmp)$/i)
            ? "image/jpeg"
            : "application/octet-stream");
        return uploadFile({
          fileUri: file.uri,
          fileName: file.name,
          fileType: mimeType,
          qrCodeId: qrId,
          folderId: undefined,
          isPublic: false,
          uploadType: "uploaded",
        });
      });

      try {
        await Promise.all(uploadPromises);
        handleDownloadStatus(true, "Files uploaded successfully");
      } catch (uploadError: any) {
        console.error("Error during file upload:", uploadError);
        handleDownloadStatus(
          false,
          `Upload failed: ${uploadError?.message || "Unknown error"}`
        );
      }

      // Add a small delay before refetching to ensure backend processing is complete
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await refetch();
    } catch (error: any) {
      console.error(
        "Error picking or uploading document:",
        error?.message,
        error?.stack
      );
      handleDownloadStatus(
        false,
        `Error: ${error?.message || "Failed to upload files"}`
      );
    } finally {
      setIsUploading(false);
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
        </>
      )}
    </Box>
  );
};

export default QRCodeDetails;
