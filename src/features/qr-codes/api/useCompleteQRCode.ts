import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@shared/api/client";
import { API_ENDPOINTS } from "@shared/api/endpoints";
import { QRCode, File, Folder, Schedule } from "@shared/types";

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

      return completeQRCode;
    },
    // Cache for 30 seconds since QR code data might change frequently
    staleTime: 30 * 1000,
  });
};
