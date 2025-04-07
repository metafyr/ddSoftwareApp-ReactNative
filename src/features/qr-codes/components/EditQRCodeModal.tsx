import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Text,
  Button,
  Input,
  InputField,
  Box,
  VStack,
  Spinner,
  StatusBar,
} from "@/../components/ui";
import { MultiSelectPopover } from "./MultiSelectPopover";
import { QRCode } from "@shared/types";
import { QRCodeScanner, useQRCodeScanner } from "@/features/qr-scanner";

interface EditQRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: (data: {
    id: string;
    name: string;
    uuid?: string;
    enabledFunctions: { files: boolean; schedules: boolean };
  }) => void;
  qrCode: QRCode | null;
  isLoading?: boolean;
}

export const EditQRCodeModal = ({
  isOpen,
  onClose,
  onEdit,
  qrCode,
  isLoading = false,
}: EditQRCodeModalProps) => {
  const [qrName, setQRName] = React.useState("");
  const [selectedFunctions, setSelectedFunctions] = React.useState<string[]>(
    []
  );
  const [uuid, setUuid] = React.useState<string>("");

  // QR code scanner for physical QR codes
  const {
    isVisible,
    scannedUUID,
    openScanner,
    closeScanner,
    handleUUIDDetected,
  } = useQRCodeScanner();

  // Initialize form values when qrCode changes
  React.useEffect(() => {
    if (qrCode) {
      setQRName(qrCode.name);
      setUuid(qrCode.uuid || "");
      const functions = ["files"]; // Always include files
      if (qrCode.enabledFunctions.schedules) functions.push("schedules");
      setSelectedFunctions(functions);
    }
  }, [qrCode]);

  const handleFunctionChange = (values: any) => {
    // Ensure we're handling the values as an array
    const selectedValues = Array.isArray(values) ? values : [values];
    
    // Always include 'files' as it's non-removable
    if (!selectedValues.includes('files')) {
      selectedValues.push('files');
    }
    
    setSelectedFunctions(selectedValues);
  };

  const handleSubmit = () => {
    if (!qrCode) return;

    if (qrName.trim() === "") {
      // Could add validation error handling here
      return;
    }

    onEdit({
      id: qrCode.id,
      name: qrName,
      uuid: uuid.trim() || undefined,
      enabledFunctions: {
        files: selectedFunctions.includes("files"),
        schedules: selectedFunctions.includes("schedules"),
      },
    });

    // Close the modal after submitting
    handleClose();
  };

  const handleClose = () => {
    setQRName("");
    setSelectedFunctions([]);
    setUuid("");
    onClose();
  };

  // Handle the scanned UUID when scanner closes
  React.useEffect(() => {
    if (scannedUUID) {
      setUuid(scannedUUID);
    }
  }, [scannedUUID]);

  // Make scanner full screen, separate from modal constraints
  React.useEffect(() => {
    if (isVisible) {
      // Set a global style to ensure the camera has highest priority
      StatusBar.setBarStyle("light-content");

      return () => {
        // Reset when scanner closes
        StatusBar.setBarStyle("dark-content");
      };
    }
  }, [isVisible]);

  // Handle the physical QR code scan
  const handleScanQRCode = () => {
    openScanner();
  };

  const functionOptions = [
    { value: "files", label: "Files (Default)" },
    { value: "schedules", label: "Schedules" },
  ];

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose}>
        <ModalContent>
          <ModalHeader>
            <Text className="text-xl font-bold">Edit QR Code</Text>
            <ModalCloseButton />
          </ModalHeader>

          <ModalBody>
            <VStack space="md" className="py-4">
              <Box>
                <Text className="font-medium mb-2">QR Code Name</Text>
                <Input size="md">
                  <InputField
                    placeholder="Enter QR code name"
                    value={qrName}
                    onChangeText={setQRName}
                  />
                </Input>
              </Box>

              <Box>
                <Text className="font-medium mb-2">Physical QR Code UUID</Text>
                <Input size="md" className="mb-2">
                  <InputField
                    placeholder="Scan or enter physical QR code UUID"
                    value={uuid}
                    onChangeText={setUuid}
                  />
                </Input>
                {!uuid && (
                  <Button
                    variant="solid"
                    size="sm"
                    className="bg-primary-600"
                    onPress={handleScanQRCode}
                  >
                    <Text className="text-white">Scan Physical QR</Text>
                  </Button>
                )}
              </Box>

              <Box>
                <Text className="font-medium mb-2">Enable Functions</Text>
                <MultiSelectPopover
                  options={functionOptions}
                  selected={selectedFunctions}
                  onChange={(values) => {
                    // Ensure 'files' is always included
                    const newValues = values.includes('files') ? values : [...values, 'files'];
                    setSelectedFunctions(newValues);
                  }}
                  placeholder="Select functions"
                  disabledValues={['files']} // Make 'files' non-removable
                />
              </Box>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button
              variant="outline"
              size="md"
              className="mr-2"
              onPress={handleClose}
              isDisabled={isLoading}
            >
              <Text>Cancel</Text>
            </Button>
            <Button
              variant="solid"
              size="md"
              className="bg-primary-600"
              onPress={handleSubmit}
              isDisabled={isLoading}
            >
              {isLoading ? (
                <Spinner color="white" size="small" />
              ) : (
                <Text className="text-white">Save Changes</Text>
              )}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* QR Code Scanner is rendered by the hook */}
      {isVisible && (
        <QRCodeScanner
          isVisible={true}
          onClose={closeScanner}
          onUUIDDetected={handleUUIDDetected}
        />
      )}
    </>
  );
};

export default EditQRCodeModal;
