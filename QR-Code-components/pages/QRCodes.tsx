import React, { useState, useMemo } from "react";
import {
  Box,
  Text,
  Button,
  HStack,
  Input,
  InputField,
  Spinner,
  ScrollView,
} from "../../components/ui";
import SwipeableQRCode from "../components/SwipeableQRCode";
import AddQRCodeModal from "../components/AddQRCodeModal";
import { Search, Plus } from "lucide-react-native";
import QRCodeDetails from "./QRCodeDetails";
import { QRCode } from "@/types";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  useQRCodes,
  useCreateQRCode,
  useUpdateQRCode,
  useDeleteQRCode,
} from "../../src/api/hooks";
import { useAuth } from "../../src/api/hooks/useAuth";
import ErrorScreen from "../../src/screens/ErrorScreen";
import LoadingScreen from "../../src/screens/LoadingScreen";

// Define the navigation param list type
type RootStackParamList = {
  Main: undefined;
  QRCodeDetails: { qrId: string };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const QRCodes = () => {
  const navigation = useNavigation<NavigationProp>();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Get the current location from auth context
  const { data: userData } = useAuth();
  const currentLocation = userData?.locations?.[0];

  // If no location is selected, show an error state
  if (!currentLocation?.id) {
    return (
      <ErrorScreen
        message="No location selected. Please select a location to view QR codes."
        onRetry={() => {}}
      />
    );
  }

  // Use React Query hooks
  const {
    data: qrCodes,
    isLoading,
    error,
    refetch,
  } = useQRCodes();

  const createQRCode = useCreateQRCode();
  const updateQRCode = useUpdateQRCode();
  const deleteQRCode = useDeleteQRCode();

  // Filter QR codes based on search query
  const filteredQRCodes = useMemo(() => {
    if (!qrCodes) return [];
    return qrCodes.filter((qrCode) =>
      qrCode.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [qrCodes, searchQuery]);

  const handleAddQR = async (data: {
    name: string;
    enabledFunctions: { files: boolean; schedules: boolean };
  }) => {
    try {
      await createQRCode.mutateAsync({
        name: data.name,
        locationId: currentLocation.id,
        enabledFunctions: data.enabledFunctions,
        createdAt: new Date().toISOString(),
      });
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error("Error adding QR code:", error);
      // Show error message to user
    }
  };

  const handleEditQR = async (qrCode: QRCode) => {
    try {
      await updateQRCode.mutateAsync(qrCode);
    } catch (error) {
      console.error("Error updating QR code:", error);
      // Show error message to user
    }
  };

  const handleDeleteQR = async (qrCode: QRCode) => {
    try {
      await deleteQRCode.mutateAsync(qrCode.id);
    } catch (error) {
      console.error("Error deleting QR code:", error);
      // Show error message to user
    }
  };

  const handleQRCodeClick = (qrCode: QRCode) => {
    navigation.navigate("QRCodeDetails", { qrId: qrCode.id });
  };

  if (isLoading) {
    return <LoadingScreen message="Loading QR codes..." />;
  }

  if (error) {
    return (
      <ErrorScreen
        message="Failed to load QR codes. Please try again."
        onRetry={refetch}
      />
    );
  }

  return (
    <Box className="flex-1 bg-background-50">
      <Box className="p-4 bg-white border-b border-outline-200 shadow-soft-1">
        <HStack space="sm" className="items-center">
          <Box className="flex-1 relative">
            <Box className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
              <Search size={20} color="#6B7280" />
            </Box>
            <Input variant="outline" size="md" className="bg-background-50">
              <InputField
                placeholder="Search QR codes..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                className="pl-10"
              />
            </Input>
          </Box>
          <Button
            variant="solid"
            size="md"
            className="bg-primary-600"
            onPress={() => setIsAddDialogOpen(true)}
          >
            <Plus size={20} color="white" />
          </Button>
        </HStack>
      </Box>

      <ScrollView className="flex-1">
        <Box className="p-4 space-y-3">
          {filteredQRCodes.length === 0 ? (
            <Box className="py-8 items-center">
              <Text className="text-gray-500">No QR codes found</Text>
            </Box>
          ) : (
            filteredQRCodes.map((qrCode) => (
              <SwipeableQRCode
                key={qrCode.id}
                qrCode={qrCode}
                onEdit={handleEditQR}
                onDelete={handleDeleteQR}
                onQRCodeClick={handleQRCodeClick}
              />
            ))
          )}
        </Box>
      </ScrollView>

      <AddQRCodeModal
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onAdd={handleAddQR}
        isLoading={createQRCode.isPending}
      />
    </Box>
  );
};

export default QRCodes;
