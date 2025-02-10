import { User, Location } from "../types";

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
