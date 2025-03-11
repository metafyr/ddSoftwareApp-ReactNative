import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../apiClient";
import { API_ENDPOINTS } from "../endpoints";
import { Schedule } from "../../types";

export const useAllSchedules = () => {
  return useQuery({
    queryKey: ["allSchedules"],
    queryFn: async () => {
      const response = await apiClient.request<Schedule[]>(
        API_ENDPOINTS.SCHEDULES
      );
      return response;
    },
  });
};
