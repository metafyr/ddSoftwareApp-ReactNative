import React from "react";
import { Box, HStack } from "@/../components/ui";
import {
  QrCode,
  CalendarDays,
  ArrowUp,
  Activity,
  ArrowDown,
} from "lucide-react-native";
import { DashboardCard } from "../components";
import { useDashboard } from "../api";
import { LoadingScreen, ErrorScreen } from "@/shared/ui";

const DashboardScreen = () => {
  const { data: dashboardData, isLoading, error, refetch } = useDashboard();

  if (isLoading) {
    return <LoadingScreen message="Loading dashboard data..." />;
  }

  if (error || !dashboardData) {
    return (
      <ErrorScreen
        message="Failed to load dashboard data. Please try again."
        onRetry={refetch}
      />
    );
  }

  return (
    <Box className="flex-1 p-4 bg-background-50">
      <HStack space="md">
        <DashboardCard
          title="Total QR Codes"
          value={dashboardData.totalQRCodes}
          icon={QrCode}
          iconColor={
            dashboardData.weeklyGrowth > 0
              ? "text-success-500"
              : "text-error-500"
          }
          metricIcon={dashboardData.weeklyGrowth > 0 ? ArrowUp : ArrowDown}
          metricText="% this week"
          metricValue={`${dashboardData.weeklyGrowth.toFixed(1)}`}
          metricColor={
            dashboardData.weeklyGrowth > 0
              ? "text-success-500"
              : "text-error-500"
          }
        />

        <DashboardCard
          title="Active Schedules"
          value={dashboardData.activeSchedules}
          icon={CalendarDays}
          iconColor="text-success-500"
          metricIcon={Activity}
          metricText="due today"
          metricValue={dashboardData.scheduledToday}
          metricColor="text-primary-500"
        />
      </HStack>
    </Box>
  );
};

export default DashboardScreen;
