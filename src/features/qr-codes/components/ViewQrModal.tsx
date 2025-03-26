import React, { useState, useRef } from "react";
import { Modal, Platform, Share, Alert, View } from "react-native";
import {
  Box,
  Text,
  Button,
  Pressable,
  Icon,
  useToast,
  VStack,
  ButtonIcon,
  ButtonText,
  Toast,
} from "@/../components/ui";
import { DownloadIcon, ShareIcon, XIcon } from "lucide-react-native";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";
import QRCode from "react-native-qrcode-svg";

interface ViewQrModalProps {
  isVisible: boolean;
  onClose: () => void;
  value?: string;
  name: string;
}

export const ViewQrModal: React.FC<ViewQrModalProps> = ({
  isVisible,
  onClose,
  value,
  name,
}) => {
  const toast = useToast();
  const [svgData, setSvgData] = useState<string | null>(null);
  const qrCodeRef = useRef<QRCode>(null);

  // Function to get the SVG data as a Promise
  const getSvgData = async (): Promise<string> => {
    // If we already have the data, return it
    if (svgData) {
      return Promise.resolve(svgData);
    }

    // Check if we have a valid QR code reference
    if (!qrCodeRef.current) {
      throw new Error("QR code reference not available");
    }

    // Check if we have a valid value
    if (!value) {
      throw new Error("No QR code value available");
    }

    // Generate the QR code data
    return new Promise((resolve, reject) => {
      try {
        // @ts-ignore - we know this method exists even if TypeScript doesn't
        qrCodeRef.current.toDataURL((data: string) => {
          if (!data) {
            reject(new Error("Failed to generate QR code image"));
            return;
          }

          // The data is already in base64 format
          // We'll store it as is and handle the prefix in the download/share functions
          setSvgData(data);
          resolve(data);
        });
      } catch (error) {
        reject(error);
      }
    });
  };

  const handleDownload = async () => {
    try {
      // Validate we have a QR code value
      if (!value) {
        toast.show({
          render: () => (
            <Toast action="error">
              <Text className="text-white">
                No QR code available to download
              </Text>
            </Toast>
          ),
        });
        return;
      }

      // Request permissions first (for Android)
      if (Platform.OS === "android") {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== "granted") {
          toast.show({
            render: () => (
              <Toast action="error">
                <Text className="text-white">
                  Sorry, we need media library permissions to download the QR
                  code
                </Text>
              </Toast>
            ),
          });
          return;
        }
      }

      // Sanitize the filename
      const sanitizedName = name.replace(/[^a-zA-Z0-9_-]/g, "_");
      const fileUri = `${FileSystem.cacheDirectory}${sanitizedName}-qrcode.png`;

      // Get the QR code data
      const data = await getSvgData();

      // The data is already in base64 format, no need to split
      const base64Data = data;

      // Validate we have base64 data
      if (!base64Data) {
        throw new Error("Failed to get QR code data");
      }

      // Write the file to cache
      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Save to media library
      const asset = await MediaLibrary.createAssetAsync(fileUri);

      // Create album if it doesn't exist
      await MediaLibrary.createAlbumAsync("QR Codes", asset, false);

      // Show success message
      toast.show({
        duration: 3000,
        render: () => (
          <Toast action="success">
            <Text className="text-white">QR Code saved to your gallery</Text>
          </Toast>
        ),
      });
    } catch (error) {
      console.error("Error downloading QR code:", error);
      toast.show({
        duration: 3000,
        render: () => (
          <Toast action="error">
            <Text className="text-white">
              Failed to download QR code. Please try again.
            </Text>
          </Toast>
        ),
      });
    }
  };

  const handleShare = async () => {
    try {
      // Validate we have a QR code value
      if (!value) {
        toast.show({
          render: () => (
            <Toast action="error">
              <Text className="text-white">No QR code available to share</Text>
            </Toast>
          ),
        });
        return;
      }

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert(
          "Sharing not available",
          "Sharing is not available on this device",
          [{ text: "OK" }]
        );
        return;
      }

      // Sanitize the filename
      const sanitizedName = name.replace(/[^a-zA-Z0-9_-]/g, "_");
      const fileUri = `${FileSystem.cacheDirectory}${sanitizedName}-qrcode.png`;

      try {
        // Get the QR code data
        const data = await getSvgData();

        // The data is already in base64 format, no need to split
        const base64Data = data;

        // Validate we have base64 data
        if (!base64Data) {
          throw new Error("Failed to get QR code data");
        }

        // Write the file
        await FileSystem.writeAsStringAsync(fileUri, base64Data, {
          encoding: FileSystem.EncodingType.Base64,
        });

        // Share the file
        await Sharing.shareAsync(fileUri, {
          mimeType: "image/png",
          dialogTitle: `QR Code for: ${name}`,
          UTI: "public.png", // For iOS
        });
      } catch (error) {
        console.error("Error getting QR data for sharing:", error);

        // Fallback to sharing text if image sharing fails
        await Share.share({
          title: `QR Code for: ${name}`,
          message: `QR Code value: ${value || "No QR Code"} for ${name}`,
        });
      }
    } catch (error) {
      console.error("Error sharing QR code:", error);
      toast.show({
        duration: 3000,
        render: () => (
          <Toast action="error">
            <Text className="text-white">
              Failed to share QR code. Please try again.
            </Text>
          </Toast>
        ),
      });
    }
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <Box className="flex-1 bg-black/60 justify-center items-center p-5">
        <Box className="bg-white rounded-xl w-full max-w-md overflow-hidden">
          <VStack space="md">
            <Box className="flex-row justify-between items-center p-5 border-b border-gray-200">
              <Text className="text-xl font-bold">{name}</Text>
              <Pressable onPress={onClose} className="p-2">
                <Icon as={XIcon} size="sm" />
              </Pressable>
            </Box>

            <Box className="items-center justify-center px-6 py-8">
              {value ? (
                <QRCode
                  value={value}
                  size={250}
                  color="#000000"
                  backgroundColor="#FFFFFF"
                  // @ts-ignore - getRef is a valid prop but not in TypeScript types
                  getRef={(ref: QRCode) => (qrCodeRef.current = ref)}
                />
              ) : (
                <Box className="items-center justify-center">
                  <Text className="text-gray-500 mb-2">
                    No QR code available
                  </Text>
                </Box>
              )}
            </Box>

            <Box className="p-5 flex-row justify-between gap-4">
              <Button
                className="flex-1 bg-primary-600 mr-2"
                size="lg"
                onPress={handleDownload}
                isDisabled={!value}
              >
                <ButtonIcon as={DownloadIcon} className="text-white mr-1" />
                <ButtonText className="text-white">Download</ButtonText>
              </Button>
              <Button
                className="flex-1 bg-secondary-600"
                size="lg"
                onPress={handleShare}
                isDisabled={!value}
              >
                <ButtonIcon as={ShareIcon} className="text-white mr-1" />
                <ButtonText className="text-white">Share</ButtonText>
              </Button>
            </Box>
          </VStack>
        </Box>
      </Box>
    </Modal>
  );
};

export default ViewQrModal;
