import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../apiClient";
import { API_ENDPOINTS } from "../endpoints";
import { File } from "../../types";

export const useFilesByQRCode = (qrCodeId: string) => {
  return useQuery({
    queryKey: ["files", "qrCode", qrCodeId],
    queryFn: async () => {
      const response = await apiClient.request<File[]>(
        API_ENDPOINTS.FILES_BY_QR_CODE(qrCodeId)
      );
      return response;
    },
    enabled: !!qrCodeId, // Only run the query if we have a QR code ID
  });
};

export const useFilesByFolder = (folderId: string) => {
  return useQuery({
    queryKey: ["files", "folder", folderId],
    queryFn: async () => {
      const response = await apiClient.request<File[]>(
        API_ENDPOINTS.FILES_BY_FOLDER(folderId)
      );
      return response;
    },
    enabled: !!folderId, // Only run the query if we have a folder ID
  });
};

export const useFileDetails = (id: string) => {
  return useQuery({
    queryKey: ["file", id],
    queryFn: async () => {
      const response = await apiClient.request<File>(
        API_ENDPOINTS.FILE_BY_ID(id)
      );
      return response;
    },
    enabled: !!id, // Only run the query if we have an ID
  });
};

export const useUploadFile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      fileUri,
      fileName,
      fileType,
      qrCodeId,
      folderId,
      isPublic = false,
      uploadType = "uploaded",
    }: {
      fileUri: string;
      fileName: string;
      fileType: string;
      qrCodeId: string;
      folderId?: string;
      isPublic?: boolean;
      uploadType?: "scanned" | "uploaded";
    }) => {
      // Create a form data object for the file upload
      const formData = new FormData();

      // Add the file to the form data
      // @ts-ignore - FormData type definition issue in React Native
      formData.append("file", {
        uri: fileUri,
        name: fileName,
        type: fileType,
      });

      // Add other parameters to the form data
      formData.append("qrCodeId", qrCodeId);
      if (folderId) {
        formData.append("folderId", folderId);
      }
      formData.append("name", fileName);
      formData.append("fileType", fileType);
      formData.append("isPublic", isPublic ? "true" : "false");
      formData.append("uploadType", uploadType);

      const response = await apiClient.request<File>(
        API_ENDPOINTS.FILE_UPLOAD,
        {
          method: "POST",
          headers: {
            // Set the Content-Type header to multipart/form-data without a boundary
            // The browser/fetch will automatically add the boundary
            "Content-Type": "multipart/form-data",
          },
          body: formData,
        }
      );

      // Log the form data for debugging
      console.log("[useUploadFile] FormData (before sending):", formData);

      return response;
    },
    onSuccess: (data, variables) => {
      // Invalidate relevant queries based on where the file was uploaded
      if (variables.folderId) {
        queryClient.invalidateQueries({
          queryKey: ["files", "folder", variables.folderId],
        });
      }
      queryClient.invalidateQueries({
        queryKey: ["files", "qrCode", variables.qrCodeId],
      });

      // Also invalidate QR code details
      queryClient.invalidateQueries({
        queryKey: ["qrCode", "details", variables.qrCodeId],
      });
    },
  });
};

export const useDeleteFile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      folderId,
      qrCodeId,
    }: {
      id: string;
      folderId?: string;
      qrCodeId?: string;
    }) => {
      await apiClient.request(API_ENDPOINTS.FILE_BY_ID(id), {
        method: "DELETE",
      });
      return { id, folderId, qrCodeId };
    },
    onSuccess: (result) => {
      // Remove the file from the cache
      queryClient.removeQueries({ queryKey: ["file", result.id] });

      // Invalidate relevant queries based on where the file was deleted from
      if (result.folderId) {
        queryClient.invalidateQueries({
          queryKey: ["files", "folder", result.folderId],
        });
      }
      if (result.qrCodeId) {
        queryClient.invalidateQueries({
          queryKey: ["files", "qrCode", result.qrCodeId],
        });
      }
    },
  });
};

export const useUpdateFile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: { id: string } & Partial<Omit<File, "id">>) => {
      const response = await apiClient.request<File>(
        API_ENDPOINTS.FILE_BY_ID(id),
        {
          method: "PUT",
          body: data,
        }
      );
      return response;
    },
    onSuccess: (data) => {
      // Update the cache for this specific file
      queryClient.setQueryData(["file", data.id], data);

      // We don't know which lists this file belongs to, so we can't
      // selectively invalidate them. Instead, we'll rely on the component
      // to update its local state with the updated file.
    },
  });
};
