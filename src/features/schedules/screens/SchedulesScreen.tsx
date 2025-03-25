import React, { useState, useMemo } from "react";
import {
  Box,
  Text,
  Button,
  ButtonText,
  HStack,
  VStack,
  Pressable,
  Switch,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableData,
} from "@/../components/ui";
import { Schedule, ScheduleResult } from "@shared/types";
import { format } from "date-fns";
import { ScheduleResultForm } from "../components";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@shared/api/client";
import { API_ENDPOINTS } from "@shared/api/endpoints";
import { useAddScheduleResult } from "../api";
import { useLocationContext } from "@app/providers/LocationProvider";
import { LoadingScreen, ErrorScreen } from "@/shared/ui";

// Function to map API Schedule to UI Schedule
const mapApiScheduleToUiSchedule = (apiSchedule: any): Schedule => {
  return {
    id: apiSchedule.id,
    title: apiSchedule.title,
    qrCodeId: apiSchedule.qrCodeId,
    startDate: apiSchedule.startDate,
    startTime: apiSchedule.startTime,
    endTime: apiSchedule.endTime,
    isAllDay: apiSchedule.isAllDay,
    repeat: apiSchedule.repeat,
    isPublic: apiSchedule.isPublic,
    nextOccurrence: apiSchedule.nextOccurrence,
    createdBy: apiSchedule.createdBy,
    createdAt: apiSchedule.createdAt,
    updatedAt: apiSchedule.updatedAt,
    status: "upcoming", // Default to upcoming, you might want to compute this based on dates
  };
};

// Function to map UI status to API status
const mapStatusToApiStatus = (
  uiStatus: string
): "completed" | "pending" | "cancelled" => {
  return uiStatus as "completed" | "pending" | "cancelled";
};

const SchedulesScreen = () => {
  const [showPastSchedules, setShowPastSchedules] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(
    null
  );
  const [isResultFormOpen, setIsResultFormOpen] = useState(false);
  const { selectedLocation } = useLocationContext();

  // Fetch schedules by location
  const {
    data: apiSchedules,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["schedules", "location", selectedLocation?.id],
    queryFn: async () => {
      if (!selectedLocation?.id) return [];
      const response = await apiClient.request<Schedule[]>(
        API_ENDPOINTS.SCHEDULE_BY_LOCATION(selectedLocation.id)
      );
      return response;
    },
    enabled: !!selectedLocation?.id,
  });

  // Add schedule result mutation
  const addScheduleResult = useAddScheduleResult();

  // Map API schedules to UI schedules
  const schedules = useMemo(() => {
    if (!apiSchedules) return [];
    return apiSchedules.map(mapApiScheduleToUiSchedule);
  }, [apiSchedules]);

  // Filter schedules based on date
  const filteredSchedules = useMemo(() => {
    if (!schedules) return [];

    return schedules.filter((schedule) => {
      const scheduleDate = new Date(schedule.startDate);
      const today = new Date();
      return showPastSchedules ? scheduleDate < today : scheduleDate >= today;
    });
  }, [schedules, showPastSchedules]);

  const handleAddResult = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setIsResultFormOpen(true);
  };

  const handleResultFormClose = () => {
    setIsResultFormOpen(false);
    setSelectedSchedule(null);
  };

  const handleResultSubmit = async (result: Partial<ScheduleResult>) => {
    if (!selectedSchedule) return;

    try {
      await addScheduleResult.mutateAsync({
        scheduleId: selectedSchedule.id,
        result: {
          date: new Date().toISOString(),
          status: mapStatusToApiStatus(result.status || "completed"),
          notes: result.notes || "",
        },
      });

      handleResultFormClose();
    } catch (error) {
      console.error("Error adding schedule result:", error);
      // Show error message to user
    }
  };

  // Show loading screen while data is being fetched
  if (isLoading) {
    return <LoadingScreen message="Loading schedules..." />;
  }

  // Show error screen if there's an error
  if (error) {
    return (
      <ErrorScreen
        message="Failed to load schedules. Please try again."
        onRetry={refetch}
      />
    );
  }

  return (
    <Box className="flex-1 flex flex-col p-4">
      <HStack className="justify-between items-center mb-4">
        <Text className="text-xl font-semibold">Schedules</Text>
        <HStack space="sm" className="items-center">
          <Text>Show Past Schedules</Text>
          <Switch
            value={showPastSchedules}
            onValueChange={setShowPastSchedules}
          />
        </HStack>
      </HStack>

      <Box className="flex-1 overflow-hidden rounded-lg">
        {filteredSchedules.length === 0 ? (
          <Box className="flex-1 justify-center items-center">
            <Text className="text-gray-500">
              {showPastSchedules
                ? "No past schedules found"
                : "No upcoming schedules found"}
            </Text>
          </Box>
        ) : (
          <Table className="w-full h-full">
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="overflow-y-auto">
              {filteredSchedules.map((schedule) => (
                <TableRow key={schedule.id}>
                  <TableData>{schedule.title}</TableData>
                  <TableData>
                    {format(new Date(schedule.startDate), "MMM dd")}
                  </TableData>
                  <TableData>
                    <Button
                      size="sm"
                      variant="outline"
                      onPress={() => handleAddResult(schedule)}
                      isDisabled={addScheduleResult.isPending}
                    >
                      <ButtonText>
                        {addScheduleResult.isPending &&
                        selectedSchedule?.id === schedule.id
                          ? "Adding..."
                          : "Add Result"}
                      </ButtonText>
                    </Button>
                  </TableData>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Box>

      {selectedSchedule && (
        <ScheduleResultForm
          schedule={selectedSchedule}
          isOpen={isResultFormOpen}
          onClose={handleResultFormClose}
          onSubmit={handleResultSubmit}
          isLoading={addScheduleResult.isPending}
        />
      )}
    </Box>
  );
};

export default SchedulesScreen;
