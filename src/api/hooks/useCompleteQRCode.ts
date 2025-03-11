import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../apiClient";
import { API_ENDPOINTS } from "../endpoints";
import { QRCode, File, Folder, Schedule } from "../../types";
import { sanitizeIds, parseDates } from "../typeUtils";

export interface CompleteQRCode extends QRCode {
  files: File[];
  folders: Folder[];
  schedules: Schedule[];
}

export const useCompleteQRCode = (id: string) => {
  return useQuery({
    queryKey: ["qrcode", "complete", id],
    queryFn: async () => {
      // Get complete QR code data from composite endpoint
      const completeQRCode = await apiClient.request<CompleteQRCode>(
        API_ENDPOINTS.COMPLETE_QR_CODE(id)
      );

      // Sanitize and parse dates in the response
      return sanitizeIds(parseDates(completeQRCode)) as CompleteQRCode;
    },
    // Cache for 30 seconds since QR code data might change frequently
    staleTime: 30 * 1000,
  });
};