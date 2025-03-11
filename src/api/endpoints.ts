export const API_ENDPOINTS = {
  // QR Code endpoints
  QR_CODES: "/protected/v1/qr",
  QR_CODE_BY_ID: (id: string) => `/protected/v1/qr/${id}`,
  QR_CODE_DETAILS: (id: string) => `/protected/v1/qr/${id}/details`,
  QR_CODES_BY_LOCATION: (locationId: string) => `/protected/v1/qr?locationId=${locationId}`,

  // Folder endpoints
  FOLDERS: "/protected/v1/folder",
  FOLDER_BY_ID: (id: string) => `/protected/v1/folder/${id}`,
  FOLDERS_BY_QR_CODE: (qrCodeId: string) => `/protected/v1/folder?qrCodeId=${qrCodeId}`,

  // File endpoints
  FILES: "/protected/v1/file",
  FILE_BY_ID: (id: string) => `/protected/v1/file/${id}`,
  FILES_BY_FOLDER: (folderId: string) => `/protected/v1/file?folderId=${folderId}`,
  FILES_BY_QR_CODE: (qrCodeId: string) => `/protected/v1/file?qrCodeId=${qrCodeId}`,
  FILE_UPLOAD: "/protected/v1/file/upload",

  // Schedule endpoints
  SCHEDULES: "/protected/v1/schedule",
  SCHEDULE_BY_ID: (id: string) => `/protected/v1/schedule/${id}`,
  SCHEDULES_BY_QR_CODE: (qrCodeId: string) => `/protected/v1/schedule?qrCodeId=${qrCodeId}`,
  SCHEDULE_BY_LOCATION: (locationId: string) => `/protected/v1/schedule/location/${locationId}`,
  UPCOMING_SCHEDULES: "/protected/v1/schedule/upcoming",
  SCHEDULE_RESULTS: (scheduleId: string) => `/protected/v1/schedule/${scheduleId}/results`,

  // User endpoints
  USERS: "/protected/v1/user",
  USER_BY_ID: (id: string) => `/protected/v1/user/${id}`,
  USER_BY_EMAIL: (email: string) => `/protected/v1/user?email=${encodeURIComponent(email)}`,
  USERS_BY_ORGANIZATION: (organizationId: string) => `/protected/v1/user/organization/${organizationId}`,
  USERS_BY_LOCATION: (locationId: string) => `/protected/v1/user/location/${locationId}`,

  // Location endpoints
  LOCATIONS: "/protected/v1/location",
  LOCATION_BY_ID: (id: string) => `/protected/v1/location/${id}`,

  // Organization endpoints
  ORGANIZATIONS: "/protected/v1/organization",
  ORGANIZATION_BY_ID: (id: string) => `/protected/v1/organization/${id}`,

  // Dashboard endpoint
  DASHBOARD_DATA: "/protected/v1/dashboard",
};
