import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../apiClient";
import { API_ENDPOINTS } from "../endpoints";

export interface DashboardData {
  totalQRCodes: number;
  activeSchedules: number;
  weeklyGrowth: number;
  scheduledToday: number;
}

export const useDashboard = () => {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const response = await apiClient.request<DashboardData>(
        API_ENDPOINTS.DASHBOARD_DATA
      );
      return response;
    },
    // Cache for 5 minutes as dashboard data doesn't need to be real-time
    staleTime: 5 * 60 * 1000,
    // Refresh when window regains focus to get latest stats
    refetchOnWindowFocus: true,
  });
};
