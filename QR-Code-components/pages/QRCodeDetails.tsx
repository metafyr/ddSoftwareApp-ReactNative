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
import { useQRCodeDetails } from "../../src/api/hooks";
import LoadingScreen from "../../src/screens/LoadingScreen";
import ErrorScreen from "../../src/screens/ErrorScreen";

type RootStackParamList = {
  Main: undefined;
  QRCodeDetails: { qrId: string };
};

type QRCodeDetailsRouteProp = RouteProp<RootStackParamList, "QRCodeDetails">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const QRCodeDetails = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<QRCodeDetailsRouteProp>();
  const { qrId } = route.params;
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [showAlert, setShowAlert] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({ show: false, message: "", type: "success" });

  // Use the QR code details hook
  const { data: qrCode, isLoading, error, refetch } = useQRCodeDetails(qrId);

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
    console.log("Selected file:", file);
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
  });

  const handleUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        multiple: true,
      });

      if (result.canceled) {
        console.log("User cancelled the upload");
        return;
      }

      // Handle successful file selection
      const files = result.assets;
      console.log("Selected files:", files);
      handleDownloadStatus(true, "Files selected successfully");

      // TODO: Implement actual file upload logic
    } catch (error) {
      console.error("Error picking document:", error);
      handleDownloadStatus(false, "Error selecting files");
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
        message="Failed to load QR code details. Please try again."
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
              <QRCodeCard name={qrCode.name} linkedPhysicalQR={qrCode.uuid} />

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

              <ScheduleSection schedules={qrCode.schedules} />
            </VStack>
          </ScrollView>

          <ExpandableFAB
            onScanPress={handleScan}
            onUploadPress={handleUpload}
            onSchedulePress={handleSchedule}
            disabled={isScanning}
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
