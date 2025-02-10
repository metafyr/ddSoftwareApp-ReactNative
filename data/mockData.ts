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
