import React, { useState } from "react";
import { Box, Text } from "../../components/ui";
import SwipeableQRCode from "../components/SwipeableQRCode";
import { mockQRCodes } from "../../data/mockData";

const QRCodes = () => {
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

  return (
    <Box className="flex-1 p-4 bg-background-50">
      <Text className="text-2xl font-bold mb-6">QR Codes</Text>
      
      <Box className="space-y-3">
        {mockQRCodes.map((qrCode) => (
          <SwipeableQRCode
            key={qrCode.id}
            qrCode={qrCode}
            onEdit={handleEditQR}
            onDelete={handleDeleteQR}
            onQRCodeClick={handleQRCodeClick}
          />
        ))}
      </Box>
    </Box>
  );
};

export default QRCodes;
