import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../apiClient";
import { API_ENDPOINTS } from "../endpoints";
import { Location, User } from "../../types";
import { useAuth } from "./useAuth";

// Extended Location type that includes user data from the backend
export interface LocationWithUser extends Location {
  user?: {
    name: string;
    email: string;
    role: string;
    orgId: string;
  };
}

export const useLocations = () => {
  const { data: userData } = useAuth();
  
  return useQuery({
    queryKey: ["locations"],
    queryFn: () => {
      if (!userData?.locations) {
        return [];
      }
      return userData.locations;
    },
    enabled: !!userData,
  });
};

export const useLocationDetails = (id: string) => {
  const { data: userData } = useAuth();
  
  return useQuery({
    queryKey: ["location", id],
    queryFn: () => {
      const location = userData?.locations?.find(loc => loc.id === id);
      if (!location) {
        throw new Error(`Location with ID ${id} not found`);
      }
      return location;
    },
    enabled: !!userData && !!id,
  });
};

export const useCreateLocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (location: Omit<Location, "id" | "created_at">) => {
      const response = await apiClient.request<Location>(
        API_ENDPOINTS.LOCATIONS,
        {
          method: "POST",
          body: location,
        }
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      queryClient.invalidateQueries({ queryKey: ["locations"] });
    },
  });
};

export const useUpdateLocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: { id: string } & Partial<Omit<Location, "id" | "created_at">>) => {
      const response = await apiClient.request<Location>(
        API_ENDPOINTS.LOCATION_BY_ID(id),
        {
          method: "PUT",
          body: data,
        }
      );
      return response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      queryClient.invalidateQueries({ queryKey: ["location", data.id] });
      queryClient.invalidateQueries({ queryKey: ["locations"] });
    },
  });
};

export const useDeleteLocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.request(API_ENDPOINTS.LOCATION_BY_ID(id), {
        method: "DELETE",
      });
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      queryClient.removeQueries({ queryKey: ["location", id] });
      queryClient.invalidateQueries({ queryKey: ["locations"] });
    },
  });
};
