import React from "react";
import { Box, Text, Pressable, HStack, Icon, View } from "../../components/ui";
import { Pencil, Trash2, QrCode } from "lucide-react-native";
import EditQRCodeModal from "./EditQRCodeModal";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import { QRCode } from "../../types";

interface SwipeableQRCodeProps {
  qrCode: QRCode;
  onEdit: (qrCode: QRCode) => void;
  onDelete: (qrCode: QRCode) => void;
  onQRCodeClick: (qrCode: QRCode) => void;
  isEditLoading?: boolean;
  isDeleteLoading?: boolean;
}

const SwipeableQRCode = ({
  qrCode,
  onEdit,
  onDelete,
  onQRCodeClick,
  isEditLoading = false,
  isDeleteLoading = false,
}: SwipeableQRCodeProps) => {
  const translateX = useSharedValue(0);
  const SWIPE_THRESHOLD = -50;
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      const x = Math.min(0, Math.max(event.translationX, -125));
      translateX.value = x;
    })
    .onEnd((event) => {
      if (event.translationX < SWIPE_THRESHOLD) {
        translateX.value = withSpring(-125);
      } else {
        translateX.value = withSpring(0);
      }
    });

  const rStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const handleEditPress = () => {
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = (updatedQRCode: {
    id: string;
    name: string;
    uuid?: string;
    enabledFunctions: { files: boolean; schedules: boolean };
  }) => {
    // Create a new QRCode object with the updated values while preserving other properties
    const editedQRCode: QRCode = {
      ...qrCode,
      name: updatedQRCode.name,
      uuid: updatedQRCode.uuid,
      enabledFunctions: updatedQRCode.enabledFunctions,
    };

    onEdit(editedQRCode);
  };

  const handleDeletePress = () => {
    setIsEditModalOpen(false);
    // Only proceed if not already loading
    if (!isDeleteLoading) {
      onDelete(qrCode);
    }
  };

  return (
    <View style={{ marginBottom: 12, width: "100%" }}>
      <Box className="relative overflow-hidden rounded-lg">
        <GestureDetector gesture={panGesture}>
          <Box className="relative">
            {/* Action buttons positioned behind the card */}
            <Box className="absolute right-0 flex-row items-center px-4 h-full">
              <Pressable
                onPress={handleEditPress}
                disabled={isEditLoading}
                className="w-12 h-12 bg-primary-500 rounded-lg mr-2 items-center justify-center"
              >
                <Icon as={Pencil} size="sm" color="white" />
              </Pressable>
              <Pressable
                onPress={handleDeletePress}
                disabled={isDeleteLoading}
                className="w-12 h-12 bg-error-500 rounded-lg items-center justify-center"
              >
                <Icon as={Trash2} size="sm" color="white" />
              </Pressable>
            </Box>

            {/* Swipeable card */}
            <Animated.View
              style={[
                rStyle,
                { width: "100%", backgroundColor: "white", borderRadius: 8 },
              ]}
            >
              <Pressable onPress={() => onQRCodeClick(qrCode)}>
                <Box className="bg-white rounded-lg p-4 shadow-sm">
                  <HStack className="justify-between items-center">
                    <Box>
                      <Text className="text-base font-medium text-typography-900 mb-1">
                        {qrCode.name}
                      </Text>
                      <Text className="text-sm text-typography-600">
                        Created:{" "}
                        {new Date(qrCode.createdAt).toLocaleDateString()}
                      </Text>
                    </Box>

                    <Icon
                      as={QrCode}
                      size="sm"
                      color={qrCode.uuid ? "#2563EB" : "#9CA3AF"}
                    />
                  </HStack>
                </Box>
              </Pressable>
            </Animated.View>
          </Box>
        </GestureDetector>

        <EditQRCodeModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onEdit={handleEditSubmit}
          qrCode={qrCode}
          isLoading={isEditLoading}
        />
      </Box>
    </View>
  );
};

export default SwipeableQRCode;
