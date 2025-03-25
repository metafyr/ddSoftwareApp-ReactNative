import * as React from "react";
import { Box, Text, HStack } from "@/../components/ui";
import { QRCodeIcon } from "./QRCodeIcon";

interface QRCodeCardProps {
  name: string;
  linkedPhysicalQR?: string;
  createdAt?: string;
}

export const QRCodeCard: React.FC<QRCodeCardProps> = ({
  name,
  linkedPhysicalQR,
  createdAt,
}) => {
  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString()
    : "";

  return (
    <Box className="bg-white p-4 border-2 rounded-xl">
      <HStack className="items-center justify-between space-x-1">
        <Box className="flex-1">
          <Text className="text-2xl font-bold">{name}</Text>
          <Text className="text-sm text-gray-500 pt-5">
            Created at: {formattedDate}
          </Text>
        </Box>
        <Box className="p-1 border border-secondary-100">
          <QRCodeIcon value={linkedPhysicalQR} size={96} />
        </Box>
      </HStack>
    </Box>
  );
};

export default QRCodeCard;
