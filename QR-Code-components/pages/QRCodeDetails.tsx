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
import { File, QRCode, Schedule } from "../../types";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { mockQRCodes } from "../../data/mockData";
import QRCodeCard from "../components/QRCodeCard";
import DocumentsSection from "../components/DocumentsSection";
import ExpandableFAB from "../components/ExpandableFAB";
import ScheduleSection from "../components/ScheduleSection";
import ScheduleForm from "../components/ScheduleForm";
import { useDocumentScanner } from "@/features/document-scanner/DocumentScanner";
import * as DocumentPicker from "expo-document-picker";

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

  const qrCode = mockQRCodes.find((qr) => qr.id === qrId);

  const handleBack = () => {
    navigation.goBack();
  };

  const getAllFiles = () => {
    if (!qrCode?.folders) return [];
    return qrCode.folders.reduce((acc: File[], folder) => {
      return [...acc, ...folder.files];
    }, []);
  };

  const getFilesByType = (type: "scanned" | "uploaded") => {
    const allFiles = getAllFiles();
    return allFiles.filter((file) => file.type === type);
  };

  const handleFilePress = (file: File) => {
    // Handle file selection here
    console.log("Selected file:", file);
  };

  if (!qrCode) {
    return (
      <Box className="flex-1 bg-background-50 justify-center items-center">
        <Text>QR Code not found</Text>
      </Box>
    );
  }

  const [showAlert, setShowAlert] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({ show: false, message: "", type: "success" });

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
        type: ["application/pdf", "image/*"], // Allow PDF and image files
        multiple: true,
      });

      if (result.canceled) {
        console.log("User cancelled the upload");
        return;
      }

      // Handle successful file selection
      const files = result.assets;
      console.log("Selected files:", files);

      // Here you would typically implement your file upload logic
      handleDownloadStatus(true, "Files selected successfully");

      // TODO: Implement your actual file upload logic here
      // For example, sending the files to your backend server
    } catch (error) {
      console.error("Error picking document:", error);
      handleDownloadStatus(false, "Error selecting files");
    }
  };

  const [showScheduleForm, setShowScheduleForm] = useState(false);

  const handleSchedule = () => {
    setShowScheduleForm(true);
  };

  const getRelevantSchedules = () => {
    return qrCode?.schedules || [];
  };

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
                linkedPhysicalQR={qrCode.linkedPhysicalQR}
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

              <ScheduleSection schedules={getRelevantSchedules()} />
            </VStack>

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
