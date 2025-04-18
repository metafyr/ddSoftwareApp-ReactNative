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
} from "@/../components/ui";
import { MultiSelectPopover } from "./MultiSelectPopover";

interface AddQRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: {
    name: string;
    enabledFunctions: { files: boolean; schedules: boolean };
  }) => void;
  isLoading?: boolean;
}

export const AddQRCodeModal = ({
  isOpen,
  onClose,
  onAdd,
  isLoading = false,
}: AddQRCodeModalProps) => {
  const [newQRName, setNewQRName] = React.useState("");
  // Files is always enabled by default and non-removable
  const [selectedFunctions, setSelectedFunctions] = React.useState<string[]>([
    "files",
  ]);

  const handleFunctionChange = (values: any) => {
    // Ensure we're handling the values as an array
    const selectedValues = Array.isArray(values) ? values : [values];

    // Always include 'files' as it's non-removable
    if (!selectedValues.includes("files")) {
      selectedValues.push("files");
    }

    setSelectedFunctions(selectedValues);
  };

  const handleSubmit = () => {
    onAdd({
      name: newQRName,
      enabledFunctions: {
        files: selectedFunctions.includes("files"),
        schedules: selectedFunctions.includes("schedules"),
      },
    });
    // The modal will be closed by the parent component after the operation completes
    // This ensures we don't close it before the toast notification is shown
  };

  const handleClose = () => {
    setNewQRName("");
    setSelectedFunctions(["files"]); // Reset to default
    onClose();
  };

  const functionOptions = [
    { value: "files", label: "Files (Default)" },
    { value: "schedules", label: "Schedules" },
  ];

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <ModalContent>
        <ModalHeader>
          <Text className="text-xl font-bold">Add New QR Code</Text>
          <ModalCloseButton />
        </ModalHeader>

        <ModalBody>
          <VStack space="md" className="py-4">
            <Box>
              <Text className="font-medium mb-2">QR Code Name</Text>
              <Input size="md">
                <InputField
                  placeholder="Enter QR code name"
                  value={newQRName}
                  onChangeText={setNewQRName}
                />
              </Input>
            </Box>

            <Box>
              <Text className="font-medium mb-2">Enable Functions</Text>
              <MultiSelectPopover
                options={functionOptions}
                selected={selectedFunctions}
                onChange={(values) => {
                  // Ensure 'files' is always included
                  const newValues = values.includes("files")
                    ? values
                    : [...values, "files"];
                  setSelectedFunctions(newValues);
                }}
                placeholder="Select functions"
                disabledValues={["files"]} // Make 'files' non-removable
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
            onPress={() => {
              if (newQRName.trim() === "") {
                // Could add validation error handling here
                return;
              }
              handleSubmit();
            }}
            isDisabled={isLoading}
          >
            {isLoading ? (
              <Spinner color="white" size="small" />
            ) : (
              <Text className="text-white">Add QR Code</Text>
            )}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AddQRCodeModal;
