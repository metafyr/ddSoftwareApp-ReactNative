import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../apiClient";
import { API_ENDPOINTS } from "../endpoints";
import { User, Organization, Location } from "../../types";
import { sanitizeIds, parseDates } from "../typeUtils";

// Enhance User details with additional data
export interface UserDetails extends User {
  userLocation?: Location; // Single primary location for the user interface
}

export const useUserDetails = (email: string) => {
  return useQuery({
    queryKey: ["user", "email", email],
    queryFn: async () => {
      const user = await apiClient.request<User>(API_ENDPOINTS.USER_BY_EMAIL(email));
      
      // User data is already complete from the backend
      // Just sanitize IDs and parse dates
      return sanitizeIds(parseDates(user)) as UserDetails;
    },
    select: (data) => ({
      ...data,
      // If there are locations, set the first one as primary location
      userLocation: data.locations?.[0],
    }),
  });
};
