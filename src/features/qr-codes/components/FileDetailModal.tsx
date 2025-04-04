import React from "react";
import {
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  ButtonText,
  Text,
  Box,
  VStack,
  HStack,
  Icon,
  Pressable,
} from "@/../components/ui";
import { Share2, Download, X } from "lucide-react-native";
import { File } from "@shared/types";

interface FileDetailModalProps {
  file: File | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload: (file: File) => void;
  onShare: (file: File) => void;
}

export const FileDetailModal = ({
  file,
  isOpen,
  onClose,
  onDownload,
  onShare,
}: FileDetailModalProps) => {
  if (!file) return null;

  const getFileTypeDetails = () => {
    const mimeType = file.mimeType?.toLowerCase() || "";

    if (mimeType.includes("pdf")) {
      return { label: "PDF Document", color: "#DBEAFE", textColor: "#1E40AF" };
    } else if (mimeType.includes("image")) {
      return { label: "Image", color: "#DCFCE7", textColor: "#047857" };
    } else if (mimeType.includes("excel") || mimeType.includes("sheet")) {
      return { label: "Spreadsheet", color: "#D1FAE5", textColor: "#047857" };
    } else if (mimeType.includes("word") || mimeType.includes("document")) {
      return { label: "Document", color: "#DBEAFE", textColor: "#1E40AF" };
    } else {
      return { label: "File", color: "#F3F4F6", textColor: "#111827" };
    }
  };

  const formatFileSize = (size: number) => {
    if (size < 1024) return `${size} B`;
    else if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    else return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString([], {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const fileType = getFileTypeDetails();

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalBackdrop />
      <ModalContent>
        <ModalHeader className={`bg-opacity-10 ${fileType.color}`}>
          <HStack className="justify-between items-center w-full">
            <Text className={`font-bold text-lg ${fileType.textColor}`}>
              {fileType.label}
            </Text>
            <Pressable
              onPress={onClose}
              hitSlop={10}
              style={{ marginLeft: "auto" }}
            >
              <Icon as={X} size="sm" className={fileType.textColor} />
            </Pressable>
          </HStack>
        </ModalHeader>

        <ModalBody>
          <VStack className="space-y-4">
            {/* File Preview */}
            <Box className="items-center justify-center h-[180px] bg-gray-50 rounded-lg my-4">
              {/* File icon or preview would go here */}
              <Box className="w-[50px] h-16 rounded flex items-center justify-center bg-red-50">
                <Box className="w-[50px] h-2.5 bg-red-200 absolute top-0 rounded-t" />
                <Text className="font-bold text-red-700">
                  {file.mimeType?.includes("pdf")
                    ? "PDF"
                    : file.mimeType?.includes("image")
                    ? "IMG"
                    : file.mimeType?.includes("excel")
                    ? "XLS"
                    : file.mimeType?.includes("word")
                    ? "DOC"
                    : "FILE"}
                </Text>
              </Box>
            </Box>

            <Text className="text-lg font-bold">{file.name}</Text>

            <Box
              className={`px-3 py-1 rounded-full self-start ${
                file.isPublic ? "bg-green-50" : "bg-gray-100"
              }`}
            >
              <Text
                className={`text-sm ${
                  file.isPublic ? "text-green-700" : "text-gray-600"
                }`}
              >
                {file.isPublic ? "Public" : "Private"}
              </Text>
            </Box>

            {/* File Info Table */}
            <VStack className="border-t border-gray-200">
              <HStack className="justify-between py-3">
                <Text className="text-gray-500">Size</Text>
                <Text>{formatFileSize(file.size)}</Text>
              </HStack>

              <HStack className="justify-between py-3 border-t border-gray-200">
                <Text className="text-gray-500">Uploaded By</Text>
                <Text>User Name</Text>
              </HStack>

              <HStack className="justify-between py-3 border-t border-gray-200">
                <Text className="text-gray-500">Date</Text>
                <Text>{formatDate(file.createdAt)}</Text>
              </HStack>

              <HStack className="justify-between py-3 border-t border-gray-200">
                <Text className="text-gray-500">Access</Text>
                <Text>{file.isPublic ? "Public" : "Private"}</Text>
              </HStack>
            </VStack>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button
            className="flex-1 mr-2"
            variant="outline"
            onPress={() => {
              onShare(file);
              onClose();
            }}
          >
            <Icon as={Share2} className="mr-1" />
            <ButtonText>Share</ButtonText>
          </Button>

          <Button
            className="flex-1 bg-primary-600"
            variant="solid"
            onPress={() => {
              onDownload(file);
              onClose();
            }}
          >
            <Icon as={Download} className="mr-1 text-white" />
            <ButtonText>Download</ButtonText>
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default FileDetailModal;
