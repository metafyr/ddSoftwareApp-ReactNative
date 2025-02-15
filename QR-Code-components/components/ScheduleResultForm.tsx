import React, { useState } from "react";
import {
  Box,
  Button,
  ButtonText,
  FormControl,
  FormControlLabel,
  FormControlLabelText,
  Input,
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Select,
  SelectTrigger,
  SelectInput,
  SelectPortal,
  SelectBackdrop,
  SelectContent,
  SelectDragIndicator,
  SelectDragIndicatorWrapper,
  SelectItem,
  Textarea,
  TextareaInput,
  VStack,
  Heading,
} from "../../components/ui";
import { Schedule, ScheduleResult } from "../../types";

interface ScheduleResultFormProps {
  schedule: Schedule;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (result: Partial<ScheduleResult>) => void;
}

const ScheduleResultForm = ({
  schedule,
  isOpen,
  onClose,
  onSubmit,
}: ScheduleResultFormProps) => {
  const [result, setResult] = useState<Partial<ScheduleResult>>({
    date: new Date().toISOString().split("T")[0],
    status: "completed",
    notes: "",
  });

  const handleSubmit = () => {
    onSubmit(result);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalBackdrop />
      <ModalContent>
        <ModalHeader>
          <Heading size="lg">Add Schedule Result</Heading>
          <ModalCloseButton />
        </ModalHeader>
        
        <ModalBody>
          <VStack space="lg">
            <FormControl>
              <FormControlLabel>
                <FormControlLabelText>Date</FormControlLabelText>
              </FormControlLabel>
              <Input
                value={result.date}
                onChangeText={(value) => setResult({ ...result, date: value })}
                type="date"
              />
            </FormControl>

            <FormControl>
              <FormControlLabel>
                <FormControlLabelText>Status</FormControlLabelText>
              </FormControlLabel>
              <Select
                selectedValue={result.status}
                onValueChange={(value) =>
                  setResult({
                    ...result,
                    status: value as ScheduleResult["status"],
                  })
                }
              >
                <SelectTrigger>
                  <SelectInput placeholder="Select status" />
                </SelectTrigger>
                <SelectPortal>
                  <SelectBackdrop />
                  <SelectContent>
                    <SelectDragIndicatorWrapper>
                      <SelectDragIndicator />
                    </SelectDragIndicatorWrapper>
                    <SelectItem label="Completed" value="completed" />
                    <SelectItem label="Pending" value="pending" />
                    <SelectItem label="Missed" value="missed" />
                  </SelectContent>
                </SelectPortal>
              </Select>
            </FormControl>

            <FormControl>
              <FormControlLabel>
                <FormControlLabelText>Notes</FormControlLabelText>
              </FormControlLabel>
              <Textarea>
                <TextareaInput
                  value={result.notes}
                  onChangeText={(value) =>
                    setResult({ ...result, notes: value })
                  }
                  placeholder="Enter any notes about the result"
                />
              </Textarea>
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="outline" onPress={onClose} className="flex-1 mr-2">
            <ButtonText>Cancel</ButtonText>
          </Button>
          <Button variant="solid" onPress={handleSubmit} className="flex-1">
            <ButtonText>Add Result</ButtonText>
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ScheduleResultForm;
