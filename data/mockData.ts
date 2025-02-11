import { User, Location, QRCode, Schedule } from "../types";

export const mockLocations: Location[] = [
  {
    location_id: "loc1",
    location_name: "Main Office",
  },
  {
    location_id: "loc2",
    location_name: "Downtown Branch",
  },
  {
    location_id: "loc3",
    location_name: "West Side Location",
  },
];

export const mockUser: User = {
  name: "John Doe",
  email: "john.doe@example.com",
  org_id: "org123",
  locations: mockLocations,
  role: "Admin",
};

export const currentLocation: Location = mockLocations[0];

export const mockQRCodes: QRCode[] = [
  {
    id: "qr1",
    uuid: "abc-123-456",
    name: "Laptop Asset Tracker",
    created: "2025-01-15",
    locationId: 1,
    linkedPhysicalQR: "PHY-001",
    enabledFunctions: {
      files: true,
      schedules: true,
    },
    folders: [
      {
        name: "Maintenance Records",
        files: [
          {
            id: "file1",
            name: "Jan_Maintenance.pdf",
            url: "https://example.com/files/jan_maintenance.pdf",
            isPublic: true,
            createdAt: "2025-01-15T10:00:00Z",
            size: 1024576,
            type: "scanned"
          },
          {
            id: "file2",
            name: "Feb_Maintenance.pdf",
            url: "https://example.com/files/feb_maintenance.pdf",
            isPublic: true,
            createdAt: "2025-02-15T10:00:00Z",
            size: 2048576,
            type: "uploaded"
          },
          // Adding more files
          {
            id: "file7",
            name: "Mar_Maintenance.pdf",
            url: "https://example.com/files/mar_maintenance.pdf",
            isPublic: true,
            createdAt: "2025-03-15T10:00:00Z",
            size: 1548576,
            type: "scanned"
          },
          {
            id: "file8",
            name: "Apr_Maintenance.pdf",
            url: "https://example.com/files/apr_maintenance.pdf",
            isPublic: true,
            createdAt: "2025-04-15T10:00:00Z",
            size: 1748576,
            type: "uploaded"
          },
          {
            id: "file9",
            name: "May_Maintenance.pdf",
            url: "https://example.com/files/may_maintenance.pdf",
            isPublic: true,
            createdAt: "2025-05-15T10:00:00Z",
            size: 1648576,
            type: "scanned"
          }
        ],
        subfolders: []
      }
    ],
    schedules: [
      {
        id: "sch1",
        title: "Weekly Maintenance Check",
        date: "2025-02-10",
        startTime: "09:00",
        endTime: "10:00",
        isAllDay: false,
        repeat: "weekly",
        location: {
          id: 1,
          name: "Main Office",
        },
        isPublic: true,
        results: [
          {
            id: "res1",
            date: "2025-02-03",
            status: "completed",
            notes: "All systems functioning normally",
          },
        ],
      },
      {
        id: "sch2",
        title: "Software Update",
        date: "2025-02-15",
        isAllDay: true,
        repeat: "monthly",
        location: {
          id: 1,
          name: "Main Office",
        },
        isPublic: true,
      },
    ],
  },
  {
    id: "qr2",
    uuid: "def-456-789",
    name: "Printer Scanner",
    created: "2025-01-20",
    locationId: 2,
    enabledFunctions: {
      files: true,
      schedules: true,
    },
    folders: [
      {
        name: "Scanned Documents",
        files: [
          {
            id: "file3",
            name: "Invoice_001.pdf",
            url: "https://example.com/files/invoice_001.pdf",
            isPublic: false,
            createdAt: "2025-02-01T14:30:00Z",
            size: 512000, // 500KB
            type: "scanned"
          },
          {
            id: "file4",
            name: "Invoice_002.pdf",
            url: "https://example.com/files/invoice_002.pdf",
            isPublic: false,
            createdAt: "2025-02-02T15:45:00Z",
            size: 614400, // 600KB
            type: "scanned"
          },
          {
            id: "file10",
            name: "Invoice_003.pdf",
            url: "https://example.com/files/invoice_003.pdf",
            isPublic: false,
            createdAt: "2025-02-03T14:30:00Z",
            size: 528000,
            type: "scanned"
          },
          {
            id: "file11",
            name: "Invoice_004.pdf",
            url: "https://example.com/files/invoice_004.pdf",
            isPublic: false,
            createdAt: "2025-02-04T15:45:00Z",
            size: 634400,
            type: "scanned"
          },
          {
            id: "file12",
            name: "Invoice_005.pdf",
            url: "https://example.com/files/invoice_005.pdf",
            isPublic: false,
            createdAt: "2025-02-05T16:45:00Z",
            size: 724400,
            type: "scanned"
          }
        ],
        subfolders: []
      },
      {
        name: "Manuals",
        files: [
          {
            id: "file5",
            name: "Printer_Manual.pdf",
            url: "https://example.com/files/printer_manual.pdf",
            isPublic: true,
            createdAt: "2025-01-20T09:00:00Z",
            size: 5242880, // 5MB
            type: "uploaded"
          }
        ],
        subfolders: []
      }
    ],
    schedules: [
      {
        id: "sch3",
        title: "Toner Check",
        date: "2025-02-10",
        startTime: "14:00",
        endTime: "14:30",
        isAllDay: false,
        repeat: "weekly",
        location: {
          id: 2,
          name: "Downtown Branch",
        },
        isPublic: true,
        results: [
          {
            id: "res2",
            date: "2025-02-03",
            status: "pending",
          },
        ],
      },
    ],
  },
  {
    id: "qr3",
    uuid: "ghi-789-012",
    name: "Conference Room Equipment",
    created: "2025-02-01",
    locationId: 1,
    linkedPhysicalQR: "PHY-002",
    enabledFunctions: {
      files: true,
      schedules: true,
    },
    folders: [
      {
        name: "Equipment Docs",
        files: [
          {
            id: "file6",
            name: "Projector_Setup.pdf",
            url: "https://example.com/files/projector_setup.pdf",
            isPublic: true,
            createdAt: "2025-02-05T11:20:00Z",
            size: 3145728, // 3MB
            type: "uploaded"
          }
        ],
        subfolders: []
      }
    ],
    schedules: [
      {
        id: "sch4",
        title: "Daily Equipment Check",
        date: "2025-02-10",
        startTime: "08:00",
        endTime: "08:30",
        isAllDay: false,
        repeat: "daily",
        location: {
          id: 1,
          name: "Main Office",
        },
        isPublic: true,
        results: [
          {
            id: "res3",
            date: "2025-02-09",
            status: "completed",
            notes: "Projector bulb replaced",
          },
        ],
      },
    ],
  },
  {
    id: "qr4",
    uuid: "jkl-012-345",
    name: "Security Camera",
    created: "2025-02-05",
    locationId: 3,
    enabledFunctions: {
      files: true,
      schedules: false,
    },
  },
];

// Helper function to count active schedules
export const getActiveSchedules = () => {
  return mockQRCodes.reduce((count, qr) => {
    const activeSchedules =
      qr.schedules?.filter((schedule) => {
        const latestResult = schedule.results?.[schedule.results.length - 1];
        return !latestResult || latestResult.status === "pending";
      }) || [];
    return count + activeSchedules.length;
  }, 0);
};

// Helper function to get schedules due today
export const getScheduledToday = () => {
  const today = new Date().toISOString().split("T")[0];
  return mockQRCodes.reduce((count, qr) => {
    const todaySchedules =
      qr.schedules?.filter((schedule) => {
        return schedule.date === today;
      }) || [];
    return count + todaySchedules.length;
  }, 0);
};

export const mockDashboardData = {
  totalQRCodes: mockQRCodes.length,
  activeSchedules: getActiveSchedules(),
  weeklyGrowth: 3, // Mocked weekly growth
  scheduledToday: getScheduledToday(),
};
