export const API_ENDPOINTS = {
  // QR Code endpoints
  QR_CODES: "/api/v1/qr",
  QR_CODE_BY_ID: (id: string) => `/api/v1/qr/${id}`,
  QR_CODE_DETAILS: (id: string, isPhysicalId: boolean = false) =>
    `/api/v1/qr/${id}/details${isPhysicalId ? "?isPhysicalId=true" : ""}`,
  QR_CODES_BY_LOCATION: (locationId: string) =>
    `/api/v1/qr?locationId=${locationId}`,

  // Folder endpoints
  FOLDERS: "/api/v1/folder",
  FOLDER_BY_ID: (id: string) => `/api/v1/folder/${id}`,
  FOLDERS_BY_QR_CODE: (qrCodeId: string) =>
    `/api/v1/folder?qrCodeId=${qrCodeId}`,

  // File endpoints
  FILES: "/api/v1/file",
  FILE_BY_ID: (id: string) => `/api/v1/file/${id}`,
  FILES_BY_FOLDER: (folderId: string) => `/api/v1/file?folderId=${folderId}`,
  FILES_BY_QR_CODE: (qrCodeId: string) => `/api/v1/file?qrCodeId=${qrCodeId}`,
  FILE_UPLOAD: "/api/v1/file/upload",
  PRESIGNED_UPLOAD: "/api/v1/file/presigned-upload",
  COMPLETE_UPLOAD: (fileId: string) => `/api/v1/file/${fileId}/complete-upload`,

  // Schedule endpoints
  SCHEDULES: "/api/v1/schedule",
  SCHEDULE_BY_ID: (id: string) => `/api/v1/schedule/${id}`,
  SCHEDULES_BY_QR_CODE: (qrCodeId: string) =>
    `/api/v1/schedule?qrCodeId=${qrCodeId}`,
  SCHEDULE_BY_LOCATION: (locationId: string) =>
    `/api/v1/schedule/location/${locationId}`,
  UPCOMING_SCHEDULES: "/api/v1/schedule/upcoming",
  SCHEDULE_RESULTS: (scheduleId: string) =>
    `/api/v1/schedule/${scheduleId}/results`,

  // User endpoints
  USERS: "/api/v1/user",
  USER_BY_ID: (id: string) => `/api/v1/user/${id}`,
  USER_BY_EMAIL: (email: string) =>
    `/api/v1/user?email=${encodeURIComponent(email)}`,
  USERS_BY_ORGANIZATION: (organizationId: string) =>
    `/api/v1/user/organization/${organizationId}`,
  USERS_BY_LOCATION: (locationId: string) =>
    `/api/v1/user/location/${locationId}`,

  // Location endpoints
  LOCATIONS: "/api/v1/location",
  LOCATION_BY_ID: (id: string) => `/api/v1/location/${id}`,

  // Organization endpoints
  ORGANIZATIONS: "/api/v1/organization",
  ORGANIZATION_BY_ID: (id: string) => `/api/v1/organization/${id}`,

  // Dashboard endpoint
  DASHBOARD_DATA: "/api/v1/dashboard",
};
