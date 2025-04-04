import React, { useState, useEffect } from "react";
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
  Input,
  InputField,
  HStack,
  Menu,
  MenuItem,
  MenuIcon,
  MenuItemLabel,
} from "@/../components/ui";
import {
  ArrowLeft,
  CheckCircleIcon,
  AlertCircleIcon,
  Search,
  Download,
  Share2,
  MoreVertical,
} from "lucide-react-native";
import { File, QRCodeDetailsType, Folder } from "@shared/types";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "@shared/types";
import { useQRCodeDetails, useUploadFile } from "../api";
import { QRCodeCard, ExpandableFAB } from "../components";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { ScheduleForm } from "@/features/schedules";
import { LoadingScreen, ErrorScreen } from "@/shared/ui";
import { useDocumentScanner } from "@/features/document-scanner";
import { compressImageIfNeeded } from "@shared/utils/fileCompression";
import { useDirectS3UploadSimple } from "../api/useDirectS3UploadSimple";
import FilesList from "../components/FilesList";
import FileDetailModal from "../components/FileDetailModal";
import { FlatList, Platform } from "react-native";
import * as MediaLibrary from "expo-media-library";
import { DownloadManager } from "@/shared/utils/downloadManager";

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
  const [activeTab, setActiveTab] = useState<"files" | "schedules" | "info">(
    "files"
  );
  const [fileFilter, setFileFilter] = useState<"uploaded" | "scanned">(
    "uploaded"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showFileDetail, setShowFileDetail] = useState(false);
  const [hasMediaPermission, setHasMediaPermission] = useState(false);

  // Use the QR code details hook
  const {
    data: qrCode,
    isLoading,
    error,
    refetch,
  } = useQRCodeDetails(qrId, { isPhysicalId });
  const { mutateAsync: uploadFile } = useUploadFile();
  const directS3Upload = useDirectS3UploadSimple();

  // Create a reference to track download progress
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [currentDownloadFilename, setCurrentDownloadFilename] = useState("");

  // Create DownloadManager with toast callbacks
  const downloadManager = new DownloadManager({
    onProgressUpdate: (progress, filename) => {
      setDownloadProgress(progress);
      setCurrentDownloadFilename(filename);
      setIsDownloading(progress < 1);

      // If complete, show success briefly then hide
      if (progress >= 1) {
        setTimeout(() => {
          setIsDownloading(false);
        }, 1000);
      }
    },
    onSuccess: (message, uri, mimeType, filename) => {
      setIsDownloading(false);
      handleDownloadStatus(true, message);
    },
    onError: (message) => {
      setIsDownloading(false);
      handleDownloadStatus(false, message);
    },
  });

  // Request media library permissions on mount
  useEffect(() => {
    (async () => {
      if (Platform.OS === "android") {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        setHasMediaPermission(status === "granted");
      }
    })();
  }, []);

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

  // Get files filtered by type and search query
  const getFilteredFiles = () => {
    const filesByType = getFilesByType(fileFilter);

    if (!searchQuery.trim()) return filesByType;

    return filesByType.filter((file) =>
      file.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const handleFilePress = (file: File) => {
    setSelectedFile(file);
    setShowFileDetail(true);
  };

  const handleFileDownloadDirect = async (file: File) => {
    try {
      setIsDownloading(true);
      setCurrentDownloadFilename(file.name);
      setDownloadProgress(0);

      await downloadManager.downloadFile(
        {
          url: file.url,
          name: file.name,
          mimeType: file.mimeType || "application/octet-stream",
        },
        {
          onProgress: (progress: number) => {
            // Progress updates are handled by the downloadManager's toast callbacks
          },
        }
      );
    } catch (error) {
      setIsDownloading(false);
      handleDownloadStatus(
        false,
        `Failed to download: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const handleFileShare = async (file: File) => {
    try {
      // Download the file first
      const fileUri = `${FileSystem.documentDirectory}${file.name}`;
      const fileInfo = await FileSystem.getInfoAsync(fileUri);

      if (!fileInfo.exists) {
        const downloadResumable = FileSystem.createDownloadResumable(
          file.url,
          fileUri,
          {},
          (downloadProgress) => {
            const progress =
              downloadProgress.totalBytesWritten /
              downloadProgress.totalBytesExpectedToWrite;
            setUploadProgress(progress);
          }
        );

        const result = await downloadResumable.downloadAsync();
        if (!result?.uri) {
          throw new Error("Download failed");
        }
      }

      // For Android, we need to ensure the file is in the media library
      let shareUri = fileUri;
      if (Platform.OS === "android") {
        const asset = await MediaLibrary.createAssetAsync(fileUri);
        shareUri = asset.uri;
      }

      // Share the file with proper MIME type
      await Sharing.shareAsync(shareUri, {
        mimeType: file.mimeType || "application/octet-stream",
        dialogTitle: `Share ${file.name}`,
        UTI: file.mimeType, // For iOS
      });

      handleDownloadStatus(true, `File shared: ${file.name}`);
    } catch (error: any) {
      handleDownloadStatus(false, `Error sharing file: ${error.message}`);
    }
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
        // Set file filter to "uploaded" after uploading new files
        setFileFilter("uploaded");
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
          <Box className="p-4 bg-white border-b border-outline-200">
            <Pressable onPress={handleBack}>
              <Icon as={ArrowLeft} size="md" color="#0F172A" />
            </Pressable>
          </Box>

          <FlatList
            data={[1]} // Dummy data to render once
            renderItem={() => (
              <VStack space="md" className="p-4">
                <QRCodeCard
                  name={qrCode.name}
                  linkedPhysicalQR={qrCode.uuid}
                  createdAt={qrCode.createdAt}
                />

                {/* Tabs */}
                <Box className=" bg-white border-b border-gray-200">
                  <HStack space="md" className="items-center justify-between">
                    <Pressable
                      onPress={() => setActiveTab("files")}
                      className="flex-1 relative py-3"
                    >
                      <Text
                        className={`text-base font-medium text-center ${
                          activeTab === "files"
                            ? "text-primary-500"
                            : "text-gray-600"
                        }`}
                      >
                        Files
                      </Text>
                      {activeTab === "files" && (
                        <Box className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />
                      )}
                    </Pressable>
                    <Pressable
                      onPress={() => setActiveTab("schedules")}
                      className="flex-1 relative py-3"
                    >
                      <Text
                        className={`text-base font-medium text-center ${
                          activeTab === "schedules"
                            ? "text-primary-500"
                            : "text-gray-600"
                        }`}
                      >
                        Schedules
                      </Text>
                      {activeTab === "schedules" && (
                        <Box className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />
                      )}
                    </Pressable>
                    <Pressable
                      onPress={() => setActiveTab("info")}
                      className="flex-1 relative py-3"
                    >
                      <Text
                        className={`text-base font-medium text-center ${
                          activeTab === "info"
                            ? "text-primary-500"
                            : "text-gray-600"
                        }`}
                      >
                        Info
                      </Text>
                      {activeTab === "info" && (
                        <Box className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />
                      )}
                    </Pressable>
                  </HStack>
                </Box>

                {/* Content */}
                <Box className="flex-1">
                  {activeTab === "files" ? (
                    <>
                      {/* File Type Filter */}
                      <HStack space="sm" className="mb-4 mt-2">
                        <Pressable
                          onPress={() => setFileFilter("uploaded")}
                          className={`px-4 py-2 rounded-full ${
                            fileFilter === "uploaded"
                              ? "bg-primary-500"
                              : "bg-gray-100"
                          }`}
                        >
                          <Text
                            className={`text-sm font-medium ${
                              fileFilter === "uploaded"
                                ? "text-white"
                                : "text-gray-600"
                            }`}
                          >
                            Uploaded
                          </Text>
                        </Pressable>

                        <Pressable
                          onPress={() => setFileFilter("scanned")}
                          className={`px-4 py-2 rounded-full ${
                            fileFilter === "scanned"
                              ? "bg-primary-500"
                              : "bg-gray-100"
                          }`}
                        >
                          <Text
                            className={`text-sm font-medium ${
                              fileFilter === "scanned"
                                ? "text-white"
                                : "text-gray-600"
                            }`}
                          >
                            Scanned
                          </Text>
                        </Pressable>
                      </HStack>

                      {/* Search Input */}
                      <Box className="mb-5">
                        <Input
                          size="lg"
                          className="bg-white border border-gray-200 rounded-lg"
                        >
                          <Icon
                            as={Search}
                            size="md"
                            className="ml-3 text-gray-400"
                          />
                          <InputField
                            placeholder="Search files..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            className="pl-3 text-base"
                          />
                        </Input>
                      </Box>

                      {/* Files List */}
                      <FilesList
                        files={getFilteredFiles()}
                        onFilePress={(file) => setSelectedFile(file)}
                        onDownloadPress={handleFileDownloadDirect}
                        onSharePress={handleFileShare}
                      />
                    </>
                  ) : (
                    <Text className="text-gray-500 text-center py-4">
                      No schedules available
                    </Text>
                  )}
                </Box>

                {activeTab === "info" && (
                  <Box className="py-8">
                    <VStack space="md">
                      <Box className="bg-white p-4 rounded-lg">
                        <Text className="text-gray-500 mb-1">QR Code ID</Text>
                        <Text className="font-semibold">{qrCode.id}</Text>
                      </Box>

                      <Box className="bg-white p-4 rounded-lg">
                        <Text className="text-gray-500 mb-1">Location</Text>
                        <Text className="font-semibold">
                          {qrCode.locationId}
                        </Text>
                      </Box>

                      <Box className="bg-white p-4 rounded-lg">
                        <Text className="text-gray-500 mb-1">Created</Text>
                        <Text className="font-semibold">
                          {new Date(qrCode.createdAt).toLocaleDateString()}
                        </Text>
                      </Box>

                      <Box className="bg-white p-4 rounded-lg">
                        <Text className="text-gray-500 mb-1">
                          Enabled Features
                        </Text>
                        <HStack space="md" className="mt-1">
                          <Box className="bg-blue-100 py-1 px-3 rounded-full">
                            <Text className="text-blue-800">
                              {qrCode.enabledFunctions.files
                                ? "Files Enabled"
                                : "Files Disabled"}
                            </Text>
                          </Box>
                          <Box className="bg-green-100 py-1 px-3 rounded-full">
                            <Text className="text-green-800">
                              {qrCode.enabledFunctions.schedules
                                ? "Schedules Enabled"
                                : "Schedules Disabled"}
                            </Text>
                          </Box>
                        </HStack>
                      </Box>
                    </VStack>
                  </Box>
                )}
              </VStack>
            )}
            keyExtractor={() => "main-content"}
            showsVerticalScrollIndicator={false}
          />

          <ExpandableFAB
            onScanPress={handleScan}
            onUploadPress={handleUpload}
            onSchedulePress={handleSchedule}
            disabled={isScanning || isUploading}
            isLoading={isScanning || isUploading}
          />

          {/* Download Progress Toast */}
          {isDownloading && (
            <Box className="absolute bottom-20 left-4 right-4">
              <Box className="bg-white p-4 rounded-lg shadow-md border border-gray-100">
                <HStack className="items-center justify-between mb-2">
                  <Text
                    className="text-gray-800 font-medium mr-4 flex-1"
                    numberOfLines={1}
                    ellipsizeMode="middle"
                  >
                    Downloading {currentDownloadFilename}
                  </Text>
                  <Text className="text-primary-500 font-medium ml-2 min-w-[45px] text-right">
                    {Math.round(downloadProgress * 100)}%
                  </Text>
                </HStack>
                <Progress
                  value={downloadProgress * 100}
                  size="sm"
                  className="bg-gray-100"
                >
                  <ProgressFilledTrack className="bg-primary-500" />
                </Progress>
              </Box>
            </Box>
          )}

          {/* Success/Error Alerts */}
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

          {/* File Detail Modal */}
          <FileDetailModal
            file={selectedFile}
            isOpen={showFileDetail}
            onClose={() => setShowFileDetail(false)}
            onDownload={handleFileDownloadDirect}
            onShare={handleFileShare}
          />
        </>
      )}
    </Box>
  );
};

export default QRCodeDetailsScreen;
