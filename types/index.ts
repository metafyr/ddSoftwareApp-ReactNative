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
