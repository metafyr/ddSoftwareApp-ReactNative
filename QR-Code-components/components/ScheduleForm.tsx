import React, { useState } from "react";
import {
  Box,
  Button,
  ButtonText,
  Text,
  Input,
  InputField,
  Select,
  SelectTrigger,
  SelectInput,
  SelectPortal,
  SelectBackdrop,
  SelectContent,
  SelectItem,
  Switch,
  VStack,
  HStack,
  Pressable,
  Icon,
} from "../../components/ui";
import { X, Calendar } from "lucide-react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Platform } from "react-native";

interface ScheduleFormProps {
  onClose: () => void;
  qrCodeId: string;
}

const ScheduleForm: React.FC<ScheduleFormProps> = ({ onClose, qrCodeId }) => {
  const [title, setTitle] = useState("");
  const [isAllDay, setIsAllDay] = useState(false);
  const [date, setDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [repeat, setRepeat] = useState("never");

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  const handleSave = () => {
    console.log({
      title,
      isAllDay,
      date,
      startTime,
      endTime,
      repeat,
      qrCodeId,
    });
    onClose();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString();
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleStartTimeChange = (event: any, selectedTime?: Date) => {
    setShowStartTimePicker(false);
    if (selectedTime) {
      setStartTime(selectedTime);
    }
  };

  const handleEndTimeChange = (event: any, selectedTime?: Date) => {
    setShowEndTimePicker(false);
    if (selectedTime) {
      setEndTime(selectedTime);
    }
  };

  const showPicker = (type: "date" | "start" | "end") => {
    if (Platform.OS === "android") {
      switch (type) {
        case "date":
          setShowDatePicker(true);
          break;
        case "start":
          setShowStartTimePicker(true);
          break;
        case "end":
          setShowEndTimePicker(true);
          break;
      }
    }
  };

  // Update the date picker sections at the bottom of the return statement
  return (
    <Box className="flex-1 bg-background-50">
      <Box className="bg-white border-b border-outline-200">
        <HStack className="p-4 justify-between items-center">
          <Button variant="link" onPress={onClose}>
            <ButtonText>Cancel</ButtonText>
          </Button>
          <Text className="text-lg font-semibold">Schedule</Text>
          <Button
            variant="solid"
            size="sm"
            onPress={handleSave}
            backgroundColor="$primary500"
          >
            <ButtonText>Save</ButtonText>
          </Button>
        </HStack>
      </Box>

      <Box className="p-4">
        <VStack space="lg">
          <Box>
            <Text className="mb-2">Title</Text>
            <Input>
              <InputField
                placeholder="Enter title"
                value={title}
                onChangeText={setTitle}
              />
            </Input>
          </Box>

          <HStack className="justify-between items-center">
            <Text>All-day</Text>
            <Switch value={isAllDay} onToggle={() => setIsAllDay(!isAllDay)} />
          </HStack>

          <Box>
            <Text className="mb-2">Date</Text>
            <Pressable
              onPress={() => setShowDatePicker(true)}
              className="border border-outline-200 rounded-lg p-4"
            >
              <HStack space="sm" alignItems="center">
                <Icon as={Calendar} size="sm" />
                <Text>{formatDate(date)}</Text>
              </HStack>
            </Pressable>
          </Box>

          {!isAllDay && (
            <HStack space="md">
              <Box flex={1}>
                <Text className="mb-2">Start Time</Text>
                <Pressable
                  onPress={() => setShowStartTimePicker(true)}
                  className="border border-outline-200 rounded-lg p-4"
                >
                  <Text>{formatTime(startTime)}</Text>
                </Pressable>
              </Box>
              <Box flex={1}>
                <Text className="mb-2">End Time</Text>
                <Pressable
                  onPress={() => setShowEndTimePicker(true)}
                  className="border border-outline-200 rounded-lg p-4"
                >
                  <Text>{formatTime(endTime)}</Text>
                </Pressable>
              </Box>
            </HStack>
          )}

          <Box>
            <Text className="mb-2">Repeat</Text>
            <Select
              selectedValue={repeat}
              onValueChange={(value) => setRepeat(value)}
            >
              <SelectTrigger>
                <SelectInput placeholder="Select repeat option" />
              </SelectTrigger>
              <SelectPortal>
                <SelectBackdrop />
                <SelectContent>
                  <SelectItem label="Never" value="never" />
                  <SelectItem label="Daily" value="daily" />
                  <SelectItem label="Weekly" value="weekly" />
                  <SelectItem label="Monthly" value="monthly" />
                </SelectContent>
              </SelectPortal>
            </Select>
          </Box>
        </VStack>
      </Box>

      {/* Replace the DateTimePickerModal components with: */}
      {showDatePicker && Platform.OS === "android" && (
        <DateTimePicker
          value={date}
          mode="date"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate && event.type !== "dismissed") {
              setDate(selectedDate);
            }
          }}
        />
      )}

      {showStartTimePicker && Platform.OS === "android" && (
        <DateTimePicker
          value={startTime}
          mode="time"
          onChange={(event, selectedTime) => {
            setShowStartTimePicker(false);
            if (selectedTime && event.type !== "dismissed") {
              setStartTime(selectedTime);
            }
          }}
        />
      )}

      {showEndTimePicker && Platform.OS === "android" && (
        <DateTimePicker
          value={endTime}
          mode="time"
          onChange={(event, selectedTime) => {
            setShowEndTimePicker(false);
            if (selectedTime && event.type !== "dismissed") {
              setEndTime(selectedTime);
            }
          }}
        />
      )}
    </Box>
  );
};

export default ScheduleForm;
