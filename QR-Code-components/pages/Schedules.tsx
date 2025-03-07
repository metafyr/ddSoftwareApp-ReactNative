import React, { useState } from "react";
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
} from "../../components/ui";
import { Schedule, ScheduleResult } from "../../types";
import { format } from "date-fns";
import ScheduleResultForm from "../components/ScheduleResultForm";
import { mockQRCodes } from "../../data/mockData";

const Schedules = () => {
  const [showPastSchedules, setShowPastSchedules] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(
    null
  );
  const [isResultFormOpen, setIsResultFormOpen] = useState(false);

  // Combine all schedules from QR codes
  const schedules: Schedule[] = mockQRCodes.reduce((acc, qr) => {
    return qr.schedules ? [...acc, ...qr.schedules] : acc;
  }, [] as Schedule[]);

  // Rest of the code remains the same
  const filteredSchedules = schedules.filter((schedule) => {
    const scheduleDate = new Date(schedule.date);
    const today = new Date();
    return showPastSchedules ? scheduleDate < today : scheduleDate >= today;
  });

  const handleAddResult = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setIsResultFormOpen(true);
  };

  const handleResultFormClose = () => {
    setIsResultFormOpen(false);
    setSelectedSchedule(null);
  };

  const handleResultSubmit = (result: Partial<ScheduleResult>) => {
    // Handle the result submission here
    console.log("Schedule result:", result);
    handleResultFormClose();
  };

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
        <Table className="w-full h-full">
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Result</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="overflow-y-auto">
            {filteredSchedules.map((schedule) => (
              <TableRow key={schedule.id}>
                <TableData>{schedule.title}</TableData>
                <TableData>
                  {format(new Date(schedule.date), "MMM dd")}
                </TableData>
                <TableData>
                  {showPastSchedules && schedule.results ? (
                    <Pressable
                      onPress={() => {
                        console.log("View result:", schedule.results);
                      }}
                    >
                      <Text className="text-primary-500">View</Text>
                    </Pressable>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onPress={() => handleAddResult(schedule)}
                    >
                      <ButtonText>Add</ButtonText>
                    </Button>
                  )}
                </TableData>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>

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

export default Schedules;
