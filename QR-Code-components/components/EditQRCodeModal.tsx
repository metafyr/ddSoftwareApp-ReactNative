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
} from "../../components/ui";
import { MultiSelectPopover } from "./MultiSelectPopover";
import { QRCode } from "../../types";

interface EditQRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: (data: {
    id: string;
    name: string;
    enabledFunctions: { files: boolean; schedules: boolean };
  }) => void;
  qrCode: QRCode | null;
  isLoading?: boolean;
}

const EditQRCodeModal = ({
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

  // Initialize form values when qrCode changes
  React.useEffect(() => {
    if (qrCode) {
      setQRName(qrCode.name);
      const functions = [];
      if (qrCode.enabledFunctions.files) functions.push("files");
      if (qrCode.enabledFunctions.schedules) functions.push("schedules");
      setSelectedFunctions(functions);
    }
  }, [qrCode]);

  const handleFunctionChange = (values: any) => {
    // Ensure we're handling the values as an array
    const selectedValues = Array.isArray(values) ? values : [values];
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
      enabledFunctions: {
        files: selectedFunctions.includes("files"),
        schedules: selectedFunctions.includes("schedules"),
      },
    });
    // The modal will be closed by the parent component after the operation completes
    // This ensures we don't close it before the toast notification is shown
  };

  const handleClose = () => {
    setQRName("");
    setSelectedFunctions([]);
    onClose();
  };

  const functionOptions = [
    { value: "files", label: "Files" },
    { value: "schedules", label: "Schedules" },
  ];

  return (
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
              <Text className="font-medium mb-2">Enable Functions</Text>
              <MultiSelectPopover
                options={functionOptions}
                selected={selectedFunctions}
                onChange={setSelectedFunctions}
                placeholder="Select functions"
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
  );
};

export default EditQRCodeModal;
