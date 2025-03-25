import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@shared/api/client";
import { API_ENDPOINTS } from "@shared/api/endpoints";
import { Schedule, ScheduleResult } from "@shared/types";

export const useSchedulesByQRCode = (qrCodeId: string) => {
  return useQuery({
    queryKey: ["schedules", "qrCode", qrCodeId],
    queryFn: async () => {
      const response = await apiClient.request<Schedule[]>(
        API_ENDPOINTS.SCHEDULES_BY_QR_CODE(qrCodeId)
      );
      return response;
    },
    enabled: !!qrCodeId, // Only run the query if we have a QR code ID
  });
};

export const useUpcomingSchedules = (qrCodeId: string) => {
  return useQuery({
    queryKey: ["schedules", "upcoming", qrCodeId],
    queryFn: async () => {
      const response = await apiClient.request<Schedule[]>(
        API_ENDPOINTS.UPCOMING_SCHEDULES(qrCodeId)
      );
      return response;
    },
    enabled: !!qrCodeId, // Only run the query if we have a QR code ID
  });
};

export const useScheduleDetails = (id: string) => {
  return useQuery({
    queryKey: ["schedule", id],
    queryFn: async () => {
      const response = await apiClient.request<Schedule>(
        API_ENDPOINTS.SCHEDULE_BY_ID(id)
      );
      return response;
    },
    enabled: !!id, // Only run the query if we have an ID
  });
};

export const useScheduleResults = (scheduleId: string) => {
  return useQuery({
    queryKey: ["scheduleResults", scheduleId],
    queryFn: async () => {
      const response = await apiClient.request<ScheduleResult[]>(
        API_ENDPOINTS.SCHEDULE_RESULTS(scheduleId)
      );
      return response;
    },
    enabled: !!scheduleId, // Only run the query if we have a schedule ID
  });
};

export const useCreateSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      schedule,
      qrCodeId,
    }: {
      schedule: Omit<Schedule, "id" | "results" | "nextOccurrence" | "status">;
      qrCodeId: string;
    }) => {
      const response = await apiClient.request<Schedule>(
        API_ENDPOINTS.SCHEDULES,
        {
          method: "POST",
          body: {
            ...schedule,
            qrCodeId,
          },
        }
      );
      return response;
    },
    onSuccess: (data, variables) => {
      // Invalidate the schedules query for the QR code
      queryClient.invalidateQueries({
        queryKey: ["schedules", "qrCode", variables.qrCodeId],
      });

      // Invalidate upcoming schedules
      queryClient.invalidateQueries({
        queryKey: ["schedules", "upcoming", variables.qrCodeId],
      });
    },
  });
};

export const useUpdateSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      qrCodeId,
      ...data
    }: { id: string; qrCodeId?: string } & Partial<Omit<Schedule, "id">>) => {
      const response = await apiClient.request<Schedule>(
        API_ENDPOINTS.SCHEDULE_BY_ID(id),
        {
          method: "PUT",
          body: data,
        }
      );
      return { ...response, qrCodeId };
    },
    onSuccess: (data) => {
      // Update the cache for this specific schedule
      queryClient.setQueryData(["schedule", data.id], data);

      // If we know the QR code ID, invalidate the schedules for that QR code
      if (data.qrCodeId) {
        queryClient.invalidateQueries({
          queryKey: ["schedules", "qrCode", data.qrCodeId],
        });

        // Invalidate upcoming schedules
        queryClient.invalidateQueries({
          queryKey: ["schedules", "upcoming", data.qrCodeId],
        });
      }
    },
  });
};

export const useDeleteSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, qrCodeId }: { id: string; qrCodeId?: string }) => {
      await apiClient.request(API_ENDPOINTS.SCHEDULE_BY_ID(id), {
        method: "DELETE",
      });
      return { id, qrCodeId };
    },
    onSuccess: (result) => {
      // Remove the schedule from the cache
      queryClient.removeQueries({ queryKey: ["schedule", result.id] });

      // Remove schedule results
      queryClient.removeQueries({ queryKey: ["scheduleResults", result.id] });

      // If we know the QR code ID, invalidate the schedules for that QR code
      if (result.qrCodeId) {
        queryClient.invalidateQueries({
          queryKey: ["schedules", "qrCode", result.qrCodeId],
        });

        // Invalidate upcoming schedules
        queryClient.invalidateQueries({
          queryKey: ["schedules", "upcoming", result.qrCodeId],
        });
      }
    },
  });
};

export const useAddScheduleResult = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      scheduleId,
      result,
    }: {
      scheduleId: string;
      result: Omit<ScheduleResult, "id" | "scheduleId" | "createdAt">;
    }) => {
      const response = await apiClient.request<ScheduleResult>(
        API_ENDPOINTS.SCHEDULE_RESULTS(scheduleId),
        {
          method: "POST",
          body: result,
        }
      );
      return { ...response, scheduleId };
    },
    onSuccess: (data) => {
      // Invalidate the schedule results
      queryClient.invalidateQueries({
        queryKey: ["scheduleResults", data.scheduleId],
      });

      // Invalidate the schedule details to update status
      queryClient.invalidateQueries({
        queryKey: ["schedule", data.scheduleId],
      });
    },
  });
};
