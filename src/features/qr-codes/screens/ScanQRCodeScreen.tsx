import React, { useEffect, useState } from "react";
import { GestureResponderEvent } from "react-native";
import {
  Box,
  Text,
  VStack,
  Icon,
  Pressable,
  Alert,
  AlertIcon,
  AlertText,
} from "@/../components/ui";
import { ArrowLeft, AlertCircleIcon } from "lucide-react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "@shared/types";
import { useQRCodeDetails } from "../api";
import { LoadingScreen } from "@/shared/ui";
type QRScanPageRouteProp = RouteProp<RootStackParamList, "QRScanPage">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ScanQRCodeScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<QRScanPageRouteProp>();
  const { qrId } = route.params;
  const [showAlert, setShowAlert] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({ show: false, message: "", type: "error" });

  // Use the QR code details hook with isPhysicalId set to true
  const {
    data: qrCode,
    isLoading,
    error,
    refetch,
  } = useQRCodeDetails(qrId, { isPhysicalId: true });

  const handleBack = () => {
    navigation.navigate("MainDashboard");
  };

  const handleRefetch = (event: GestureResponderEvent) => {
    refetch();
  };

  // If QR code is found, navigate to QRCodeDetails
  useEffect(() => {
    if (qrCode) {
      navigation.navigate("QRCodeDetails", {
        qrId: qrId,
        isPhysicalId: true,
      });
    }
  }, [qrCode, qrId, navigation]);

  // Show loading screen while data is being fetched
  if (isLoading) {
    return <LoadingScreen message="Verifying QR code..." />;
  }

  // Show error screen if there's an error
  if (error || !qrCode) {
    return (
      <Box className="flex-1 bg-background-50 p-4">
        <Box className="p-4 bg-white border-b border-outline-200">
          <Pressable onPress={handleBack}>
            <Icon as={ArrowLeft} size="md" color="#0F172A" />
          </Pressable>
        </Box>

        <VStack space="md" className="p-4 items-center justify-center flex-1">
          <Text className="text-xl font-bold text-center">
            QR Code Not Found
          </Text>
          <Text className="text-center text-outline-500">
            The scanned QR code could not be found in our system. It may not be
            registered or may have been deleted.
          </Text>
          <Pressable
            onPress={handleRefetch}
            className="bg-primary-600 py-3 px-6 rounded-lg mt-4"
          >
            <Text className="text-white font-semibold">Try Again</Text>
          </Pressable>
          <Pressable onPress={handleBack} className="py-3 px-6 rounded-lg mt-2">
            <Text className="text-primary-600 font-semibold">Go Back</Text>
          </Pressable>
        </VStack>

        {showAlert.show && (
          <Box className="absolute bottom-4 left-4 right-4">
            <Alert action="error">
              <AlertIcon as={AlertCircleIcon} />
              <AlertText>{showAlert.message}</AlertText>
            </Alert>
          </Box>
        )}
      </Box>
    );
  }

  // This should not be visible as we navigate away when qrCode is available
  return <LoadingScreen message="Redirecting to QR code details..." />;
};

export default ScanQRCodeScreen;
