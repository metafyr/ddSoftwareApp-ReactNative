export interface Location {
  id: string;
  name: string;
  org_id: string;
  created_at: string;
}

export interface User {
  name: string;
  email: string;
  orgId: string;
  locations: Location[];
  role: string;
}

export interface QRCode {
  id: string;
  name: string;
  locationId: string;
  uuid?: string; // for physical QR ID
  enabledFunctions: {
    files: boolean;
    schedules: boolean;
  };
  createdAt: string; // ISO date string
}

export interface File {
  id: string;
  name: string;
  url: string;
  isPublic: boolean;
  size: number;
  type: "uploaded" | "scanned";
  folderId: string;
  qrCodeId: string;
  createdAt: string;
}

export interface Folder {
  id: string;
  name: string;
  parentFolderId: string | null;
  createdAt: string;
  files: File[];
  subFolders: { [key: string]: Folder };
}

export interface Schedule {
  id: string;
  title: string;
  qrCodeId: string;
  startDate: string;
  startTime?: string;
  endTime?: string;
  isAllDay: boolean;
  repeat: "never" | "daily" | "weekly" | "monthly";
  isPublic: boolean;
  nextOccurrence: string;
  createdBy: string | null;
  createdAt: string;
  updatedAt?: string;
  status: "upcoming" | "today" | "overdue" | "completed";
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

export interface ScheduleResult {
  id: string;
  date: string;
  status: "completed" | "pending" | "missed";
  notes?: string;
  attachments?: File[];
}

export interface DashboardData {
  totalQRCodes: number;
  activeSchedules: number;
  weeklyGrowth: number;
  scheduledToday: number;
}
