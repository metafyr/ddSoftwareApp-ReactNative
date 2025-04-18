import React, { useState, useMemo } from "react";
import {
  Box,
  Text,
  Button,
  HStack,
  Input,
  InputField,
  ScrollView,
  RefreshControl,
  useToast,
  Toast,
  ToastTitle,
  ToastDescription,
} from "@/../components/ui";
import { Search, Plus } from "lucide-react-native";
import { QRCode } from "@shared/types";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  useQRCodes,
  useCreateQRCode,
  useUpdateQRCode,
  useDeleteQRCode,
} from "../api";
import { useLocationContext } from "@app/providers/LocationProvider";
import { RootStackParamList } from "@shared/types";

import { AddQRCodeModal } from "../components";
import SwipeableQRCode from "../components/SwipeableQRCode";
import { ErrorScreen, LoadingScreen } from "@/shared/ui";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const QRCodesScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeSwipeId, setActiveSwipeId] = useState<string | null>(null);

  const { selectedLocation } = useLocationContext();
  const currentLocation = selectedLocation;

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
  const { data: qrCodes, isLoading, error, refetch } = useQRCodes();

  const createQRCode = useCreateQRCode();
  const updateQRCode = useUpdateQRCode();
  const deleteQRCode = useDeleteQRCode();

  // Handle pull-to-refresh
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    setActiveSwipeId(null); // Reset active swipe when refreshing
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Filter QR codes based on search query
  const filteredQRCodes = useMemo(() => {
    if (!qrCodes) return [];

    // Make sure qrCodes is an array before filtering
    const qrCodesArray = Array.isArray(qrCodes) ? qrCodes : [];

    return qrCodesArray.filter((qrCode) =>
      qrCode.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [qrCodes, searchQuery]);

  // Reset active swipe when adding a new QR code
  const handleOpenAddDialog = () => {
    setActiveSwipeId(null);
    setIsAddDialogOpen(true);
  };

  const handleAddQR = async (data: {
    name: string;
    enabledFunctions: { files: boolean; schedules: boolean };
  }) => {
    try {
      const result = await createQRCode.mutateAsync({
        name: data.name,
        locationId: currentLocation.id,
        enabledFunctions: data.enabledFunctions,
        createdAt: new Date().toISOString(),
        // Note: orgId is now handled in the useCreateQRCode hook
      });

      // Show success toast
      toast.show({
        render: () => (
          <Toast action="success" variant="solid">
            <ToastTitle>Success</ToastTitle>
            <ToastDescription>QR code created successfully</ToastDescription>
          </Toast>
        ),
        placement: "top",
        duration: 3000,
      });

      // Refetch QR codes to update the list
      refetch();
      setIsAddDialogOpen(false);
    } catch (error) {
      // Show error toast
      toast.show({
        render: () => (
          <Toast action="error" variant="solid">
            <ToastTitle>Error</ToastTitle>
            <ToastDescription>Failed to create QR code</ToastDescription>
          </Toast>
        ),
        placement: "top",
        duration: 3000,
      });
    }
  };

  const handleEditQR = async (qrCode: QRCode) => {
    try {
      const result = await updateQRCode.mutateAsync(qrCode);

      // Show success toast
      toast.show({
        render: () => (
          <Toast action="success" variant="solid">
            <ToastTitle>Success</ToastTitle>
            <ToastDescription>QR code updated successfully</ToastDescription>
          </Toast>
        ),
        placement: "top",
        duration: 3000,
      });

      // Refetch QR codes to update the list
      refetch();
    } catch (error) {
      // Show error toast
      toast.show({
        render: () => (
          <Toast action="error" variant="solid">
            <ToastTitle>Error</ToastTitle>
            <ToastDescription>Failed to update QR code</ToastDescription>
          </Toast>
        ),
        placement: "top",
        duration: 3000,
      });
    }
  };

  const handleDeleteQR = async (qrCode: QRCode) => {
    try {
      const result = await deleteQRCode.mutateAsync(qrCode.id);

      // Show success toast
      toast.show({
        render: () => (
          <Toast action="success" variant="solid">
            <ToastTitle>Success</ToastTitle>
            <ToastDescription>QR code deleted successfully</ToastDescription>
          </Toast>
        ),
        placement: "top",
        duration: 3000,
      });

      // Refetch QR codes to update the list
      refetch();
    } catch (error) {
      // Show error toast
      toast.show({
        render: () => (
          <Toast action="error" variant="solid">
            <ToastTitle>Error</ToastTitle>
            <ToastDescription>Failed to delete QR code</ToastDescription>
          </Toast>
        ),
        placement: "top",
        duration: 3000,
      });
    }
  };

  const handleQRCodeClick = (qrCode: QRCode) => {
    setActiveSwipeId(null); // Reset active swipe when navigating
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
        <HStack space="sm" className="items-center w-full">
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
            onPress={handleOpenAddDialog}
          >
            <Plus size={20} color="white" />
          </Button>
        </HStack>
      </Box>

      <Box className="p-4 space-y-3 flex-1">
        <ScrollView
          style={{ flex: 1, height: "100%" }}
          contentContainerStyle={{ paddingBottom: 20, width: "100%" }}
          onScroll={() => {
            // Reset active swipe when scrolling
            setActiveSwipeId(null);
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#2563EB"]} // Primary color
              tintColor="#2563EB"
            />
          }
        >
          {filteredQRCodes.length === 0 ? (
            <Box className="py-8 items-center">
              <Text className="text-gray-500">
                {isLoading
                  ? "Loading QR codes..."
                  : error
                  ? "Error loading QR codes"
                  : "No QR codes found"}
              </Text>
            </Box>
          ) : filteredQRCodes.map ? (
            <Box style={{ width: "100%" }}>
              {filteredQRCodes.map((qrCode) => (
                <SwipeableQRCode
                  key={qrCode.id}
                  qrCode={qrCode}
                  onEdit={handleEditQR}
                  onDelete={handleDeleteQR}
                  onQRCodeClick={handleQRCodeClick}
                  isEditLoading={updateQRCode.isPending}
                  isDeleteLoading={deleteQRCode.isPending}
                  activeSwipeId={activeSwipeId}
                  setActiveSwipeId={setActiveSwipeId}
                />
              ))}
            </Box>
          ) : (
            <Box className="py-8 items-center">
              <Text className="text-gray-500">
                Error: QR codes data is not in the expected format
              </Text>
            </Box>
          )}
        </ScrollView>
      </Box>

      <AddQRCodeModal
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onAdd={handleAddQR}
        isLoading={createQRCode.isPending}
      />
    </Box>
  );
};

export default QRCodesScreen;
