import React, { useState } from "react";
import {
  Box,
  Button,
  ButtonText,
  FormControl,
  FormControlLabel,
  FormControlLabelText,
  Input,
  InputField,
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
  Spinner,
} from "@/../components/ui";
import { Schedule, ScheduleResult } from "@shared/types";

interface ScheduleResultFormProps {
  schedule: Schedule;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (result: Partial<ScheduleResult>) => void;
  isLoading?: boolean;
}

const ScheduleResultForm = ({
  schedule,
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: ScheduleResultFormProps) => {
  const [result, setResult] = useState<Partial<ScheduleResult>>({
    date: new Date().toISOString().split("T")[0],
    status: "completed",
    notes: "",
  });

  const handleSubmit = () => {
    onSubmit(result);
    // Only close if not loading
    if (!isLoading) {
      onClose();
    }
  };

  // Map UI status to API status if needed
  const mapStatusToApiStatus = (
    uiStatus: string
  ): "completed" | "cancelled" | "pending" => {
    if (uiStatus === "missed") {
      return "cancelled"; // Map "missed" to "cancelled" for API
    }
    return uiStatus as "completed" | "cancelled" | "pending";
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
              <Input>
                <InputField
                  value={result.date}
                  onChangeText={(text: string) =>
                    setResult({ ...result, date: text })
                  }
                  editable={!isLoading}
                />
              </Input>
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
                isDisabled={isLoading}
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
                  onChangeText={(text: string) =>
                    setResult({ ...result, notes: text })
                  }
                  placeholder="Enter any notes about the result"
                  editable={!isLoading}
                />
              </Textarea>
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button
            variant="outline"
            onPress={onClose}
            className="flex-1 mr-2"
            isDisabled={isLoading}
          >
            <ButtonText>Cancel</ButtonText>
          </Button>
          <Button
            variant="solid"
            onPress={handleSubmit}
            className="flex-1"
            isDisabled={isLoading}
          >
            {isLoading ? (
              <Spinner color="white" size="small" />
            ) : (
              <ButtonText>Add Result</ButtonText>
            )}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ScheduleResultForm;
