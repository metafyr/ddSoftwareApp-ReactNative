import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@shared/api/client";
import { API_ENDPOINTS } from "@shared/api/endpoints";
import { DashboardData } from "@shared/types";

export const useDashboard = (orgId?: string) => {
  return useQuery({
    queryKey: ["dashboard", orgId],
    queryFn: async () => {
      if (!orgId) {
        throw new Error("Organization ID is required to fetch dashboard data");
      }
      
      const response = await apiClient.request<DashboardData>(
        `${API_ENDPOINTS.DASHBOARD_DATA}?orgId=${orgId}`
      );
      return response;
    },
    // Only enable the query if we have an organization ID
    enabled: !!orgId,
    // Cache for 5 minutes as dashboard data doesn't need to be real-time
    staleTime: 5 * 60 * 1000,
    // Refresh when window regains focus to get latest stats
    refetchOnWindowFocus: true,
  });
};
