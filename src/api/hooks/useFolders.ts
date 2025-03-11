import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../apiClient";
import { API_ENDPOINTS } from "../endpoints";
import { Folder } from "../../types";

export const useFoldersByQRCode = (qrCodeId: string) => {
  return useQuery({
    queryKey: ["folders", "qrCode", qrCodeId],
    queryFn: async () => {
      const response = await apiClient.request<Folder[]>(
        API_ENDPOINTS.FOLDERS_BY_QR_CODE(qrCodeId)
      );
      return response;
    },
    enabled: !!qrCodeId, // Only run the query if we have a QR code ID
  });
};

export const useFolderDetails = (id: string) => {
  return useQuery({
    queryKey: ["folder", id],
    queryFn: async () => {
      const response = await apiClient.request<Folder>(
        API_ENDPOINTS.FOLDER_BY_ID(id)
      );
      return response;
    },
    enabled: !!id, // Only run the query if we have an ID
  });
};

export const useCreateFolder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      qrCodeId,
      parentFolderId,
    }: {
      name: string;
      qrCodeId: string;
      parentFolderId?: string;
    }) => {
      const response = await apiClient.request<Folder>(API_ENDPOINTS.FOLDERS, {
        method: "POST",
        body: {
          name,
          qrCodeId,
          parentFolderId,
        },
      });
      return response;
    },
    onSuccess: (data, variables) => {
      // Invalidate the folders query for the QR code
      queryClient.invalidateQueries({
        queryKey: ["folders", "qrCode", variables.qrCodeId],
      });

      // If this is a subfolder, also invalidate the parent folder
      if (variables.parentFolderId) {
        queryClient.invalidateQueries({
          queryKey: ["folder", variables.parentFolderId],
        });
      }
    },
  });
};

export const useUpdateFolder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: { id: string } & Partial<Omit<Folder, "id">>) => {
      const response = await apiClient.request<Folder>(
        API_ENDPOINTS.FOLDER_BY_ID(id),
        {
          method: "PUT",
          body: data,
        }
      );
      return response;
    },
    onSuccess: (data, variables, context) => {
      // Update the cache for this specific folder
      queryClient.setQueryData(["folder", data.id], data);

      // We don't know which QR code this folder belongs to, so we can't
      // selectively invalidate the folders list. The component will need to
      // handle this by passing the QR code ID to the mutation and then
      // invalidating the appropriate queries.
    },
  });
};

export const useDeleteFolder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      qrCodeId,
      parentFolderId,
    }: {
      id: string;
      qrCodeId?: string;
      parentFolderId?: string;
    }) => {
      await apiClient.request(API_ENDPOINTS.FOLDER_BY_ID(id), {
        method: "DELETE",
      });
      return { id, qrCodeId, parentFolderId };
    },
    onSuccess: (result) => {
      // Remove the folder from the cache
      queryClient.removeQueries({ queryKey: ["folder", result.id] });

      // Invalidate relevant queries based on where the folder was deleted from
      if (result.qrCodeId) {
        queryClient.invalidateQueries({
          queryKey: ["folders", "qrCode", result.qrCodeId],
        });
      }
      if (result.parentFolderId) {
        queryClient.invalidateQueries({
          queryKey: ["folder", result.parentFolderId],
        });
      }
    },
  });
};
