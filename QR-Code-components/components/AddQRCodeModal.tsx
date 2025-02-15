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
  Select,
  SelectTrigger,
  SelectInput,
  SelectIcon,
  SelectPortal,
  SelectBackdrop,
  SelectContent,
  SelectDragIndicator,
  SelectDragIndicatorWrapper,
  SelectItem,
} from "../../components/ui";
import { ChevronDown } from "lucide-react-native";
import { MultiSelectPopover } from "./MultiSelectPopover";

interface AddQRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: {
    name: string;
    enabledFunctions: { files: boolean; schedules: boolean };
  }) => void;
}

const AddQRCodeModal = ({ isOpen, onClose, onAdd }: AddQRCodeModalProps) => {
  const [newQRName, setNewQRName] = React.useState("");
  const [selectedFunctions, setSelectedFunctions] = React.useState<string[]>(
    []
  );

  const handleFunctionChange = (values: any) => {
    // Ensure we're handling the values as an array
    const selectedValues = Array.isArray(values) ? values : [values];
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
    handleClose();
  };

  const handleClose = () => {
    setNewQRName("");
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
          >
            <Text>Cancel</Text>
          </Button>
          <Button
            variant="solid"
            size="md"
            className="bg-primary-600"
            onPress={handleSubmit}
          >
            <Text className="text-white">Add QR Code</Text>
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AddQRCodeModal;
