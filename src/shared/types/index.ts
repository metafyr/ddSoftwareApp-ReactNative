/**
 * Type definitions for the application
 * Based on the standardized field naming conventions
 */

export interface QRCode {
  id: string;
  name: string;
  locationId: string;
  uuid?: string; // for physical QR ID
  enabledFunctions: {
    files: boolean;
    schedules: boolean;
  };
  created: string; // ISO date string
  createdAt?: string; // ISO date string (alternative naming)
}

export interface QRCodeDetailsType {
  id: string;
  name: string;
  locationId: string;
  uuid?: string;
  enabledFunctions: {
    files: boolean;
    schedules: boolean;
  };
  createdAt: string;
  folders: { [key: string]: Folder };
  schedules: Schedule[];
}

export interface File {
  id: string;
  name: string;
  url: string;
  isPublic: boolean;
  createdAt: string; // ISO date string
  size: number;
  type: string;
  mimeType?: string;
  folderId?: string;
  qrCodeId?: string;
}

export interface Folder {
  id: string;
  name: string;
  parentFolderId?: string | null;
  createdAt?: string;
  files: File[];
  subfolders?: Folder[];
  subFolders?: { [key: string]: Folder };
}

export interface Location {
  id: string;
  name: string;
  org_id: string;
  created_at: string;
}

export interface Schedule {
  id: string;
  title: string;
  date?: string; // ISO date string
  startTime?: string;
  endTime?: string;
  isAllDay: boolean;
  repeat: string; // e.g., "daily", "weekly", "monthly", "none"
  location?: Location;
  isPublic: boolean;
  results?: ScheduleResult[];
  nextOccurrence: string; // ISO date string
  status: "upcoming" | "completed" | "cancelled" | "today" | "overdue";
  qrCodeId?: string;
  startDate?: string;
  createdBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ScheduleResult {
  id: string;
  scheduleId?: string;
  date: string; // ISO date string
  notes?: string;
  status: "completed" | "cancelled" | "pending" | "missed";
  createdAt?: string; // ISO date string
  attachments?: File[];
}

export interface Organization {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  organizationId: string;
  organizationName: string;
  name: string;
  email: string;
  roleId: string;
  roleName: string;
  locationIds: string[];
  locations: Location[];
  createdAt: string;
  role: "Admin" | "Manager" | "User";
  permissions?: {
    [resourceType: string]: string[];
  };
  orgId?: string;
}

export interface DashboardData {
  totalQRCodes: number;
  activeSchedules: number;
  weeklyGrowth: number;
  scheduledToday: number;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Navigation types
export type RootStackParamList = {
  MainDashboard: undefined;
  SignIn: undefined;
  QRCodeDetails: { qrId: string; isPhysicalId?: boolean };
  QRScanPage: { qrId: string };
  ScheduleDetails: { scheduleId: string };
  FileViewer: { fileId: string };
};
