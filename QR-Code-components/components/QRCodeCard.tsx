import React from "react";
import { Box, Text, HStack } from "../../components/ui";
import QRCodeIcon from "./QRCodeIcon";

interface QRCodeCardProps {
  name: string;
  linkedPhysicalQR?: string;
}

const QRCodeCard: React.FC<QRCodeCardProps> = ({ name, linkedPhysicalQR }) => {
  return (
    <Box className="bg-white p-4 rounded-xl">
      <HStack className="items-center justify-between space-x-1">
        <Box className="flex-1">
          <Text className="text-2xl font-bold">{name}</Text>
        </Box>
        <Box className="p-1">
          <QRCodeIcon value={linkedPhysicalQR} size={96} />
        </Box>
      </HStack>
    </Box>
  );
};

export default QRCodeCard;