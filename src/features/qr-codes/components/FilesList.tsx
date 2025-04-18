import React, { useState } from "react";
import {
  Box,
  FlatList,
  Text,
  Pressable,
  HStack,
  Icon,
  Menu,
  MenuItem,
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogCloseButton,
  Button,
  ButtonText,
  CloseIcon,
} from "@/../components/ui";
import { FileIcon, MoreVertical, Download, Share2, Trash2 } from "lucide-react-native";
import { File } from "@shared/types";

interface FilesListProps {
  files: File[];
  onFilePress: (file: File) => void;
  onDownloadPress: (file: File) => void;
  onSharePress: (file: File) => void;
  onDeletePress: (file: File) => void;
}

const getFileTypeInfo = (file: File) => {
  const mimeType = file.mimeType?.toLowerCase() || "";

  if (mimeType.includes("pdf")) {
    return { type: "PDF", color: "#B91C1C", bgColor: "#FEE2E2" };
  } else if (mimeType.includes("image")) {
    return { type: "IMG", color: "#047857", bgColor: "#DCFCE7" };
  } else if (mimeType.includes("excel") || mimeType.includes("sheet")) {
    return { type: "XLS", color: "#047857", bgColor: "#D1FAE5" };
  } else if (mimeType.includes("word") || mimeType.includes("document")) {
    return { type: "DOC", color: "#1E40AF", bgColor: "#DBEAFE" };
  } else {
    return { type: "FILE", color: "#6B7280", bgColor: "#F3F4F6" };
  }
};

const formatFileSize = (size: number) => {
  if (size < 1024) return `${size} B`;
  else if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  else return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();

  if (date.toDateString() === now.toDateString()) {
    return `Today at ${date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  } else if (
    date.toDateString() ===
    new Date(now.setDate(now.getDate() - 1)).toDateString()
  ) {
    return "Yesterday";
  } else {
    return date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
};

export const FilesList = ({
  files,
  onFilePress,
  onDownloadPress,
  onSharePress,
  onDeletePress,
}: FilesListProps) => {
  const [fileToDelete, setFileToDelete] = React.useState<File | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  
  const handleDeletePress = (file: File) => {
    setFileToDelete(file);
    setShowDeleteConfirm(true);
  };
  
  const confirmDelete = () => {
    if (fileToDelete) {
      onDeletePress(fileToDelete);
      setShowDeleteConfirm(false);
      setFileToDelete(null);
    }
  };
  
  // Modified to handle direct download on row click
  const handleRowPress = (file: File) => {
    // Download and open the file directly instead of just showing file details
    onDownloadPress(file);
  };
  return (
    <>
      <FlatList
        data={files}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const fileType = getFileTypeInfo(item);

          return (
            <Pressable onPress={() => handleRowPress(item)}>
              <Box className="mb-3 p-4 bg-white rounded-lg border border-gray-200">
                <HStack className="items-center space-x-4">
                  {/* File Details */}
                  <Box className="flex-1">
                    <Text className="font-medium text-sm" numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text className="text-gray-500 text-xs">
                      {formatFileSize(item.size)} • {formatDate(item.createdAt)}
                    </Text>
                  </Box>

                  {/* Menu - Download option removed */}
                  <Menu
                    trigger={(triggerProps) => (
                      <Pressable 
                        hitSlop={10} 
                        {...triggerProps}
                        // Prevent row press event from triggering when menu is opened
                        onPress={(e) => {
                          e.stopPropagation();
                          triggerProps.onPress && triggerProps.onPress(e);
                        }}
                      >
                        <Box className="w-8 h-8 rounded-full bg-gray-50 items-center justify-center">
                          <Icon
                            as={MoreVertical}
                            size="sm"
                            className="text-gray-600"
                          />
                        </Box>
                      </Pressable>
                    )}
                  >
                    <MenuItem 
                      onPress={(e) => {
                        // Prevent row press event from triggering
                        e.stopPropagation();
                        onSharePress(item);
                      }}
                    >
                      <HStack space="sm" className="items-center">
                        <Icon as={Share2} size="sm" className="text-gray-600" />
                        <Text>Share</Text>
                      </HStack>
                    </MenuItem>
                    <MenuItem 
                      onPress={(e) => {
                        // Prevent row press event from triggering
                        e.stopPropagation();
                        handleDeletePress(item);
                      }}
                    >
                      <HStack space="sm" className="items-center">
                        <Icon as={Trash2} size="sm" className="text-red-600" />
                        <Text className="text-red-600">Delete</Text>
                      </HStack>
                    </MenuItem>
                  </Menu>
                </HStack>
              </Box>
            </Pressable>
          );
        }}
        contentContainerClassName="pb-4"
        showsVerticalScrollIndicator={false}
      />
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setFileToDelete(null);
        }}
      >
        <AlertDialogBackdrop />
        <AlertDialogContent>
          <AlertDialogHeader>
            <Text className="text-lg font-semibold">Delete File</Text>
            <AlertDialogCloseButton>
              <Icon as={CloseIcon} />
            </AlertDialogCloseButton>
          </AlertDialogHeader>
          <AlertDialogBody>
            <Text>
              Are you sure you want to delete "{fileToDelete?.name}"? This action cannot be undone.
            </Text>
          </AlertDialogBody>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onPress={() => {
                setShowDeleteConfirm(false);
                setFileToDelete(null);
              }}
              className="mr-2"
            >
              <ButtonText>Cancel</ButtonText>
            </Button>
            <Button
              variant="solid"
              colorScheme="error"
              onPress={confirmDelete}
            >
              <ButtonText>Delete</ButtonText>
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default FilesList;
