import * as React from "react";
import { Animated } from "react-native";
import { Box, Text, HStack, Pressable, StatusBar } from "@/../components/ui";
import { useRef, useEffect } from "react";
import { QRCodeIcon } from "./QRCodeIcon";
import ViewQrModal from "./ViewQrModal";
import { QRCodeScanner, useQRCodeScanner } from "@/features/qr-scanner";

interface QRCodeCardProps {
  name: string;
  linkedPhysicalQR?: string;
  createdAt?: string;
  isCompact?: boolean; // Added prop to handle compact mode during scrolling/searching
  onPhysicalQRLinked?: (uuid: string) => void; // Callback for when a physical QR is linked
}

export const QRCodeCard: React.FC<QRCodeCardProps> = ({
  name,
  linkedPhysicalQR,
  createdAt,
  isCompact = false, // Default to non-compact mode
  onPhysicalQRLinked,
}) => {
  const [modalVisible, setModalVisible] = React.useState(false);
  const heightAnim = useRef(new Animated.Value(1)).current;
  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString()
    : "";

  // QR code scanner for physical QR codes
  const {
    isVisible,
    scannedUUID,
    openScanner,
    closeScanner,
    handleUUIDDetected,
  } = useQRCodeScanner();

  // Handle the QR code press - either view the linked QR code or open scanner to link one
  const handleQRCodePress = () => {
    if (linkedPhysicalQR) {
      // If already has a physical QR, show it
      setModalVisible(true);
    } else {
      // If no physical QR linked, open scanner to link one
      openScanner();
    }
  };

  // Make scanner full screen, separate from modal constraints
  React.useEffect(() => {
    if (isVisible) {
      // Set a global style to ensure the camera has highest priority
      StatusBar.setBarStyle("light-content");

      return () => {
        // Reset when scanner closes
        StatusBar.setBarStyle("dark-content");
      };
    }
  }, [isVisible]);

  // Handle the scanned UUID when scanner closes
  React.useEffect(() => {
    if (scannedUUID && onPhysicalQRLinked) {
      console.log("Calling onPhysicalQRLinked with UUID:", scannedUUID);
      onPhysicalQRLinked(scannedUUID);
      
      // Close the scanner and reset the scanned UUID
      closeScanner();
    }
  }, [scannedUUID, onPhysicalQRLinked, closeScanner]);

  // Animation effect when isCompact changes
  useEffect(() => {
    Animated.timing(heightAnim, {
      toValue: isCompact ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isCompact, heightAnim]);

  return (
    <Animated.View
      style={{
        height: heightAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [40, 128], // Increased normal mode height to ensure full visibility with margin
        }),
        marginBottom: heightAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 15], // Add bottom margin when in full view
        }),
        overflow: "hidden",
      }}
    >
      <Box
        className={`bg-white border-[0.5px] rounded-xl ${
          isCompact ? "py-2 px-3" : "p-3"
        }`}
      >
        <HStack className="items-center justify-between space-x-1">
          <Box className="flex-1">
            <Text className="text-lg font-semibold">{name}</Text>
            {!isCompact && (
              <Text className="text-xs text-gray-500 pt-2">
                Created at: {formattedDate}
              </Text>
            )}
          </Box>

          {/* Only show QR code in non-compact mode */}
          {!isCompact && (
            <Pressable onPress={handleQRCodePress}>
              <Box
                className={`p-1 border border-secondary-100 ${
                  !linkedPhysicalQR ? "opacity-50" : ""
                }`}
              >
                <QRCodeIcon value={linkedPhysicalQR} size={60} />
              </Box>
            </Pressable>
          )}

          {modalVisible && linkedPhysicalQR && (
            <ViewQrModal
              isVisible={modalVisible}
              onClose={() => setModalVisible(false)}
              value={linkedPhysicalQR}
              name={name}
            />
          )}

          {/* QR Code Scanner is rendered by the hook */}
          {isVisible && (
            <QRCodeScanner
              isVisible={true}
              onClose={closeScanner}
              onUUIDDetected={handleUUIDDetected}
            />
          )}
        </HStack>
      </Box>
    </Animated.View>
  );
};

export default QRCodeCard;
