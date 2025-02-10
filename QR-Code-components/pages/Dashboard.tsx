import React from "react";
import { Box, Text, HStack } from "../../components/ui";
import { QrCode, CalendarDays, ArrowUp, Activity } from "lucide-react-native";
import { mockDashboardData } from "../../data/mockData";
import DashboardCard from "../components/DashboardCard";

const Dashboard = () => {
  return (
    <Box className="flex-1 p-4 bg-background-50">
      <Text className="text-2xl font-bold mb-6 text-typography-900">
        Dashboard
      </Text>

      <HStack space="md">
        <DashboardCard
          title="Total QR Codes"
          value={mockDashboardData.totalQRCodes}
          icon={QrCode}
          iconColor="text-primary-500"
          metricIcon={ArrowUp}
          metricText="this week"
          metricValue={`+${mockDashboardData.weeklyGrowth}`}
          metricColor="text-success-500"
        />

        <DashboardCard
          title="Active Schedules"
          value={mockDashboardData.activeSchedules}
          icon={CalendarDays}
          iconColor="text-success-500"
          metricIcon={Activity}
          metricText="due today"
          metricValue={mockDashboardData.scheduledToday}
          metricColor="text-primary-500"
        />
      </HStack>
    </Box>
  );
};

export default Dashboard;
