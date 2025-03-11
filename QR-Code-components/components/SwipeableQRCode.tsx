import React from "react";
import { Box, Text, Pressable, HStack, Icon } from "../../components/ui";
import { Pencil, Trash2, QrCode } from "lucide-react-native";
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
}

const SwipeableQRCode = ({
  qrCode,
  onEdit,
  onDelete,
  onQRCodeClick,
}: SwipeableQRCodeProps) => {
  const translateX = useSharedValue(0);
  const SWIPE_THRESHOLD = -50;

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

  return (
    <Box className="relative overflow-hidden rounded-lg">
      <Box className="absolute right-0 flex-row items-center px-4 h-full">
        <Pressable
          onPress={() => onEdit(qrCode)}
          className="w-12 h-12 bg-primary-500 rounded-lg mr-2 items-center justify-center"
        >
          <Icon as={Pencil} size="sm" color="white" />
        </Pressable>
        <Pressable
          onPress={() => onDelete(qrCode)}
          className="w-12 h-12 bg-error-500 rounded-lg items-center justify-center"
        >
          <Icon as={Trash2} size="sm" color="white" />
        </Pressable>
      </Box>

      <GestureDetector gesture={panGesture}>
        <Animated.View style={rStyle}>
          <Pressable onPress={() => onQRCodeClick(qrCode)}>
            <Box className="bg-white rounded-lg p-4 shadow-sm">
              <HStack className="justify-between items-center">
                <Box>
                  <Text className="text-base font-medium text-typography-900 mb-1">
                    {qrCode.name}
                  </Text>
                  <Text className="text-sm text-typography-600">
                    Created: {new Date(qrCode.createdAt).toLocaleDateString()}
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
      </GestureDetector>
    </Box>
  );
};

export default SwipeableQRCode;