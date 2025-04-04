import * as React from "react";
import { Box, Text, HStack, Pressable } from "@/../components/ui";
import { QRCodeIcon } from "./QRCodeIcon";
import ViewQrModal from "./ViewQrModal";

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
  const [modalVisible, setModalVisible] = React.useState(false);
  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString()
    : "";

  return (
    <Box className="bg-white p-3 border-[0.5px] rounded-xl">
      <HStack className="items-center justify-between space-x-1">
        <Box className="flex-1">
          <Text className="text-lg font-semibold">{name}</Text>
          <Text className="text-xs text-gray-500 pt-2">
            Created at: {formattedDate}
          </Text>
        </Box>
        <Pressable
          onPress={() => (linkedPhysicalQR ? setModalVisible(true) : null)}
        >
          <Box className="p-1 border border-secondary-100">
            <QRCodeIcon value={linkedPhysicalQR} size={60} />
          </Box>
        </Pressable>

        {modalVisible && (
          <ViewQrModal
            isVisible={modalVisible}
            onClose={() => setModalVisible(false)}
            value={linkedPhysicalQR}
            name={name}
          />
        )}
      </HStack>
    </Box>
  );
};

export default QRCodeCard;
