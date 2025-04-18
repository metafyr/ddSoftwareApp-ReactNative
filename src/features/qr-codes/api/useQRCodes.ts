import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@shared/api/client";
import { API_ENDPOINTS } from "@shared/api/endpoints";
import { QRCode, QRCodeDetailsType } from "@shared/types";
import { useLocationContext } from "@app/providers/LocationProvider";
import { useAuth } from "@features/auth/api/useAuth";

interface QRCodeDetailsOptions {
  isPhysicalId?: boolean;
}

export const useQRCodes = () => {
  const { selectedLocation } = useLocationContext();

  return useQuery({
    queryKey: ["qrCodes", selectedLocation?.id],
    queryFn: async () => {
      if (!selectedLocation?.id) {
        return [];
      }
      return apiClient.request<QRCode[]>(
        API_ENDPOINTS.QR_CODES_BY_LOCATION(selectedLocation.id)
      );
    },
    enabled: !!selectedLocation?.id,
  });
};

export const useQRCodeDetails = (
  id: string,
  options?: QRCodeDetailsOptions
) => {
  const isPhysicalId = options?.isPhysicalId || false;

  return useQuery({
    queryKey: ["qrCode", "details", id, isPhysicalId],
    queryFn: async () => {
      const response = await apiClient.request<QRCodeDetailsType>(
        API_ENDPOINTS.QR_CODE_DETAILS(id, isPhysicalId)
      );
      return response;
    },
    enabled: !!id,
    staleTime: 30 * 1000, // Consider data stale after 30 seconds
  });
};

export const useCreateQRCode = () => {
  const queryClient = useQueryClient();
  const { selectedLocation } = useLocationContext();
  const { data: userData } = useAuth();

  return useMutation({
    mutationFn: async (qrCode: Omit<QRCode, "id" | "created">) => {
      // Get the organization ID from the user data or selected location
      const orgId = userData?.orgId || userData?.organizationId || selectedLocation?.org_id;
      // Get the user ID for creator attribution
      const userId = userData?.id;
      
      if (!orgId) {
        throw new Error("Organization ID is required but not available");
      }

      if (!userId) {
        throw new Error("User ID is required for QR code creation");
      }

      console.log("Creating QR code with orgId:", orgId, "and userId:", userId);
      
      const response = await apiClient.request<QRCode>(API_ENDPOINTS.QR_CODES, {
        method: "POST",
        body: {
          ...qrCode,
          orgId,
          locationId: selectedLocation?.id,
          creatorId: userId, // Creator ID is now required by the backend
        },
      });
      return response;
    },
    onSuccess: (data, variables, context) => {
      // Invalidate the QR codes query to refetch the list
      queryClient.invalidateQueries({
        queryKey: ["qrCodes", selectedLocation?.id],
      });
      
      // Also invalidate dashboard data to update statistics
      queryClient.invalidateQueries({
        queryKey: ["dashboard"],
      });
    },
  });
};

export const useUpdateQRCode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<QRCode>) => {
      const response = await apiClient.request<QRCode>(
        API_ENDPOINTS.QR_CODE_BY_ID(id),
        {
          method: "PUT",
          body: data,
        }
      );
      return response;
    },
    onSuccess: (data, variables, context) => {
      // Update the cache for this specific QR code
      queryClient.setQueryData(["qrCode", data.id], data);
      // Invalidate the QR codes list
      queryClient.invalidateQueries({ queryKey: ["qrCodes", data.locationId] });
      // Invalidate dashboard data to update statistics
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
};

export const useDeleteQRCode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.request(API_ENDPOINTS.QR_CODE_BY_ID(id), {
        method: "DELETE",
      });
      return id;
    },
    onSuccess: (id, variables, context) => {
      // Remove the QR code from the cache
      queryClient.removeQueries({ queryKey: ["qrCode", id] });
      // Invalidate the QR codes list
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "qrCodes",
      });
      // Invalidate dashboard data to update statistics
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
};
