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
    refetch 
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
      
    return (
      <ErrorScreen
        message={errorMessage}
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
