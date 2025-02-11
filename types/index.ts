export interface Location {
  location_id: string;
  location_name: string;
}

export interface User {
  name: string;
  email: string;
  org_id: string;
  locations: Location[];
  role: string;
}

export interface QRCode {
  id: string;
  uuid: string;
  name: string;
  created: string;
  locationId: number;
  linkedPhysicalQR?: string;
  enabledFunctions: {
    files: boolean;
    schedules: boolean;
  };
  folders?: Folder[];
  schedules?: Schedule[];
}

export interface File {
  id: string;
  name: string;
  url: string;
  isPublic: boolean;
  createdAt: string;
  size: number; // in bytes
  type: FileType;
}

export type FileType = "scanned" | "uploaded";

export interface Folder {
  name: string;
  files: File[];
  subfolders: Folder[];
}

export interface Schedule {
  id: string;
  title: string;
  date: string;
  startTime?: string;
  endTime?: string;
  isAllDay: boolean;
  repeat: "never" | "daily" | "weekly" | "monthly";
  location: {
    id: number;
    name: string;
  };
  isPublic: boolean;
  results?: ScheduleResult[];
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
