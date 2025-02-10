import React from 'react';
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
  Switch,
  Box,
  HStack,
  VStack,
} from '../../components/ui';

interface AddQRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: { name: string; enabledFunctions: { files: boolean; schedules: boolean } }) => void;
}

const AddQRCodeModal = ({ isOpen, onClose, onAdd }: AddQRCodeModalProps) => {
  const [newQRName, setNewQRName] = React.useState('');
  const [enableFiles, setEnableFiles] = React.useState(false);
  const [enableSchedules, setEnableSchedules] = React.useState(false);

  const handleSubmit = () => {
    onAdd({
      name: newQRName,
      enabledFunctions: {
        files: enableFiles,
        schedules: enableSchedules,
      },
    });
    handleClose();
  };

  const handleClose = () => {
    setNewQRName('');
    setEnableFiles(false);
    setEnableSchedules(false);
    onClose();
  };

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

            <HStack space="sm" className="items-center">
              <Switch
                size="md"
                value={enableFiles}
                onValueChange={setEnableFiles}
              />
              <Text>Enable Files</Text>
            </HStack>

            <HStack space="sm" className="items-center">
              <Switch
                size="md"
                value={enableSchedules}
                onValueChange={setEnableSchedules}
              />
              <Text>Enable Schedules</Text>
            </HStack>
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