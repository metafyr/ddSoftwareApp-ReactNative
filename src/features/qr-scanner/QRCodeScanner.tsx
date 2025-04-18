import React, { useState, useEffect, useCallback } from "react";
import {
  Text,
  View,
  StyleSheet,
  Modal,
  Dimensions,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Button, Spinner } from "@/../components/ui";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Linking from "expo-linking";

// Get screen dimensions for full-screen camera
const SCREEN_WIDTH = Dimensions.get("window").width;
const SCREEN_HEIGHT = Dimensions.get("window").height;

interface QRCodeScannerProps {
  isVisible: boolean;
  onClose: () => void;
  onUUIDDetected: (uuid: string) => void;
}

export const QRCodeScanner: React.FC<QRCodeScannerProps> = ({
  isVisible,
  onClose,
  onUUIDDetected,
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  // Force camera to show when modal is visible
  useEffect(() => {
    if (isVisible) {
      console.log("QRCodeScanner is visible");
      // Small delay to ensure modal is fully rendered before showing camera
      const timer = setTimeout(() => {
        setShowCamera(true);
      }, 300);
      return () => {
        clearTimeout(timer);
        setShowCamera(false);
      };
    } else {
      setShowCamera(false);
    }
  }, [isVisible]);

  // Request permission when modal becomes visible
  useEffect(() => {
    if (isVisible && permission && !permission.granted) {
      requestPermission();
    }
  }, [isVisible, permission]);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;

    console.log("QR code scanned:", data);
    setScanned(true);

    // Check if the scanned data matches the expected format: ddsoftware://physical/UUID
    const regex =
      /^ddsoftware:\/\/physical\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;
    const match = data.match(regex);

    if (match) {
      // Extract the UUID from the matched pattern
      const uuid = match[1];
      console.log("Valid QR code format. UUID extracted:", uuid);
      onUUIDDetected(uuid);
      onClose();
    } else {
      // Show error message for invalid format
      console.warn(
        "Invalid QR code format. Expected format: ddsoftware://physical/UUID"
      );

      // If it's a different ddsoftware:// URL, we could handle it differently
      if (data.startsWith("ddsoftware://")) {
        console.log(
          "Detected ddsoftware URL but not in the required format:",
          data
        );
      }

      // Allow scanning again
      setScanned(false);
    }
  };

  if (!isVisible) return null;

  return (
    <Modal
      visible={isVisible}
      animationType="fade"
      transparent={false}
      onRequestClose={onClose}
      presentationStyle="fullScreen"
      hardwareAccelerated={true}
    >
      <View style={styles.container}>
        {!permission && (
          <View style={styles.permissionContainer}>
            <Spinner color="#3498db" size="large" />
            <Text style={styles.text}>Requesting camera permission...</Text>
          </View>
        )}

        {permission && !permission.granted && (
          <View style={styles.permissionContainer}>
            <Text style={styles.errorText}>No access to camera</Text>
            <Text style={styles.text}>
              We need your permission to access the camera.
            </Text>
            <Button onPress={requestPermission} style={styles.button}>
              <Text style={styles.buttonText}>Grant Permission</Text>
            </Button>
          </View>
        )}

        {permission && permission.granted && showCamera && (
          <>
            {/* Full screen camera */}
            <CameraView
              style={styles.camera}
              facing="back"
              onMountError={(error) => console.error("Camera error:", error)}
              barcodeScannerSettings={{
                barcodeTypes: ["qr"],
              }}
              onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            />

            {/* Scan frame overlay */}
            <View
              pointerEvents="none"
              style={styles.overlay}
              testID="qrScannerOverlay"
            >
              <Text style={styles.scanText}>Scan Physical Device QR Code</Text>
              <View style={styles.scanBorder} />
              <Text style={styles.instructionText}>
                Position QR code in the frame
              </Text>
            </View>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              {scanned && (
                <TouchableOpacity
                  style={styles.scanButton}
                  onPress={() => setScanned(false)}
                >
                  <Text style={styles.buttonText}>Scan Again</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.scanButton, styles.cancelButton]}
                onPress={onClose}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
    ...Platform.select({
      ios: {
        paddingTop: 50, // Account for iOS status bar
      },
      android: {
        paddingTop: 0, // Android status bar is accounted for differently
      },
    }),
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  camera: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    position: "absolute",
    top: 0,
    left: 0,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
    zIndex: 10,
  },
  scanText: {
    fontSize: 18,
    color: "white",
    fontWeight: "bold",
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
  },
  scanBorder: {
    width: 250,
    height: 250,
    marginVertical: 20,
    borderWidth: 2,
    borderColor: "#3498db",
    backgroundColor: "transparent",
  },
  instructionText: {
    fontSize: 14,
    color: "white",
    marginTop: 10,
    textAlign: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 5,
    borderRadius: 5,
  },
  buttonContainer: {
    position: "absolute",
    bottom: 40,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  scanButton: {
    backgroundColor: "#3498db",
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 10,
  },
  cancelButton: {
    backgroundColor: "#e74c3c",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  text: {
    marginTop: 20,
    fontSize: 16,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  errorText: {
    color: "#e74c3c",
    fontSize: 16,
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#3498db",
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 10,
  },
});

// Custom hook for using the QR code scanner
export const useQRCodeScanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [scannedUUID, setScannedUUID] = useState<string | null>(null);

  const openScanner = useCallback(() => {
    console.log("Opening QR scanner");
    setIsVisible(true);
    setScannedUUID(null);
  }, []);

  const closeScanner = useCallback(() => {
    console.log("Closing QR scanner");
    setIsVisible(false);
  }, []);

  const handleUUIDDetected = useCallback((uuid: string) => {
    console.log("UUID detected in hook:", uuid);
    setScannedUUID(uuid);
    
    // Close scanner after UUID is detected
    setTimeout(() => {
      closeScanner();
    }, 500);
  }, [closeScanner]);

  return {
    isVisible,
    scannedUUID,
    openScanner,
    closeScanner,
    handleUUIDDetected,
  };
};

export default QRCodeScanner;
