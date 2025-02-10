import React, { useState } from "react";
import {
  Box,
  Text,
  Button,
  HStack,
  Input,
  InputField,
} from "../../components/ui";
import SwipeableQRCode from "../components/SwipeableQRCode";
import AddQRCodeModal from "../components/AddQRCodeModal";
import { mockQRCodes } from "../../data/mockData";
import { Search, Plus } from "lucide-react-native";

const QRCodes = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const handleAddQR = (data: { name: string; enabledFunctions: { files: boolean; schedules: boolean } }) => {
    // TODO: Implement API call
    console.log("Adding new QR code:", data);
  };

  const handleEditQR = (qrCode: any) => {
    // TODO: Implement edit functionality
    console.log("Edit QR Code:", qrCode);
  };

  const handleDeleteQR = (qrCode: any) => {
    // TODO: Implement delete functionality
    console.log("Delete QR Code:", qrCode);
  };

  const handleQRCodeClick = (qrCode: any) => {
    // TODO: Implement QR code click functionality
    console.log("QR Code clicked:", qrCode);
  };

  // Filter QR codes based on search query
  const filteredQRCodes = mockQRCodes.filter((qrCode) =>
    qrCode.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box className="flex-1 bg-background-50">
      <Box className="p-4 bg-white border-b border-outline-200 shadow-soft-1">
        <Text className="text-2xl font-bold mb-4">QR Codes</Text>

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

      <Box className="p-4 space-y-3">
        {filteredQRCodes.map((qrCode) => (
          <SwipeableQRCode
            key={qrCode.id}
            qrCode={qrCode}
            onEdit={handleEditQR}
            onDelete={handleDeleteQR}
            onQRCodeClick={handleQRCodeClick}
          />
        ))}
      </Box>

      <AddQRCodeModal
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onAdd={handleAddQR}
      />
    </Box>
  );
};

export default QRCodes;
