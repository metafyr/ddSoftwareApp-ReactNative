import React from "react";
import { Box, HStack } from "@/../components/ui";
import {
  QrCode,
  CalendarDays,
  ArrowUp,
  Activity,
  ArrowDown,
  Minus,
} from "lucide-react-native";
import { DashboardCard } from "../components";
import { useDashboard } from "../api";
import { LoadingScreen, ErrorScreen } from "@/shared/ui";
import { useAuth } from "@/features/auth/api";

const DashboardScreen = () => {
  // Get the current authenticated user
  const { data: user, isLoading: isLoadingUser } = useAuth();

  // Get the organization ID from the user data
  const orgId = user?.organizationId || user?.orgId;

  // Fetch dashboard data with the organization ID
  const {
    data: dashboardData,
    isLoading: isLoadingDashboard,
    error,
    refetch,
  } = useDashboard(orgId);

  // Show loading screen if either user or dashboard data is loading
  if (isLoadingUser || isLoadingDashboard) {
    return <LoadingScreen message="Loading dashboard data..." />;
  }

  // Show error screen if there's an error or no orgId available
  if (error || !dashboardData || !orgId) {
    const errorMessage = !orgId
      ? "Unable to determine your organization. Please contact support."
      : "Failed to load dashboard data. Please try again.";

    return <ErrorScreen message={errorMessage} onRetry={refetch} />;
  }

  // Helper function to determine the appropriate icon based on growth value
  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return ArrowUp;
    if (growth < 0) return ArrowDown;
    return Minus; // Neutral icon for 0% growth
  };

  // Helper function to determine the appropriate color based on growth value
  const getGrowthColor = (growth: number) => {
    if (growth > 0) return "text-success-500";
    if (growth < 0) return "text-error-500";
    return "text-typography-500"; // Neutral color for 0% growth
  };

  return (
    <Box className="flex-1 p-4 bg-background-50">
      <HStack space="md">
        <DashboardCard
          title="Total QR Codes"
          value={dashboardData.totalQRCodes}
          icon={QrCode}
          iconColor={getGrowthColor(dashboardData.weeklyGrowth)}
          metricIcon={getGrowthIcon(dashboardData.weeklyGrowth)}
          metricText="% this week"
          metricValue={`${dashboardData.weeklyGrowth.toFixed(1)}`}
          metricColor={getGrowthColor(dashboardData.weeklyGrowth)}
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
