import React from "react";
import { Box } from "../../components/ui";
import QRCode from "react-native-qrcode-svg";

interface QRCodeIconProps {
  value?: string;
  size?: number;
}

const QRCodeIcon: React.FC<QRCodeIconProps> = ({ value, size = 100 }) => {
  return (
    <Box className="items-center justify-center p-4">
      {value ? (
        <QRCode value={value} size={size} />
      ) : (
        <QRCode 
          value="no-qr-code"
          size={size}
          color="#D1D5DB" // grey color for disabled state
        />
      )}
    </Box>
  );
};

export default QRCodeIcon;