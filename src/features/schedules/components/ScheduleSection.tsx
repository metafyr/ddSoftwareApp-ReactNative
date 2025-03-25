import React, { useState } from "react";
import {
  Box,
  Text,
  HStack,
  Icon,
  ScrollView,
  Pressable,
} from "@/../components/ui";
import { Schedule } from "@shared/types";
import {
  AlertCircle,
  Clock,
  CheckCircle,
  AlertTriangle,
} from "lucide-react-native";
import { format } from "date-fns";
import ScheduleResultForm from "./ScheduleResultForm";

interface ScheduleSectionProps {
  schedules: Schedule[];
  onSchedulePress?: (schedule: Schedule) => void;
}

const ScheduleSection = ({
  schedules,
  onSchedulePress,
}: ScheduleSectionProps) => {
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(
    null
  );
  const [isResultFormOpen, setIsResultFormOpen] = useState(false);

  const handleSchedulePress = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setIsResultFormOpen(true);
    onSchedulePress?.(schedule);
  };

  const handleResultFormClose = () => {
    setIsResultFormOpen(false);
    setSelectedSchedule(null);
  };

  const handleResultSubmit = (result: any) => {
    // Handle the result submission here
    console.log("Schedule result:", result);
  };

  const getStatusIcon = (status: Schedule["status"]) => {
    switch (status) {
      case "upcoming":
        return Clock;
      case "today":
        return AlertTriangle;
      case "overdue":
        return AlertCircle;
      case "completed":
        return CheckCircle;
      default:
        return Clock;
    }
  };

  const getStatusColor = (status: Schedule["status"]) => {
    switch (status) {
      case "upcoming":
        return "text-success-500";
      case "today":
        return "text-warning-500";
      case "overdue":
        return "text-error-500";
      case "completed":
        return "text-typography-400";
      default:
        return "text-typography-400";
    }
  };

  const formatTimeRange = (startTime?: string, endTime?: string) => {
    if (!startTime) return "";
    return endTime
      ? `${startTime.slice(0, 5)} - ${endTime.slice(0, 5)}`
      : startTime.slice(0, 5);
  };

  return (
    <Box className="bg-white p-4 rounded-xl">
      <Text className="text-lg font-semibold mb-4">Schedules</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <HStack space="sm" className="pb-2">
          {schedules.map((schedule) => (
            <Pressable
              key={schedule.id}
              onPress={() => handleSchedulePress(schedule)}
            >
              <Box className="bg-background-50 p-3 rounded-lg w-32 h-24">
                <HStack space="sm" className="items-start mb-1">
                  <Icon
                    as={getStatusIcon(schedule.status)}
                    size="sm"
                    className={`${getStatusColor(
                      schedule.status
                    )} flex-shrink-0 mt-0.5`}
                  />
                  <Box className="flex-1 min-w-0">
                    <Text
                      className="font-medium text-typography-900"
                      numberOfLines={1}
                    >
                      {schedule.title}
                    </Text>
                  </Box>
                </HStack>
                <Text className="text-sm text-typography-600" numberOfLines={1}>
                  {schedule.isAllDay
                    ? "All Day"
                    : formatTimeRange(schedule.startTime, schedule.endTime)}
                </Text>
                <Text className="text-sm text-typography-600" numberOfLines={1}>
                  {format(new Date(schedule.startDate), "MMM dd, yyyy")}
                </Text>
              </Box>
            </Pressable>
          ))}
        </HStack>
      </ScrollView>

      {selectedSchedule && (
        <ScheduleResultForm
          schedule={selectedSchedule}
          isOpen={isResultFormOpen}
          onClose={handleResultFormClose}
          onSubmit={handleResultSubmit}
        />
      )}
    </Box>
  );
};

export default ScheduleSection;
