import React, { createContext, useContext, useState, useEffect } from 'react';
import { Location } from '@shared/types';
import { useLocations } from '@features/locations/api/useLocations';

interface LocationContextType {
  selectedLocation: Location | null;
  setSelectedLocation: (location: Location) => void;
  locations: Location[];
  isLoading: boolean;
}

const LocationContext = createContext<LocationContextType>({
  selectedLocation: null,
  setSelectedLocation: () => {},
  locations: [],
  isLoading: true,
});

export const LocationProvider = ({ children }: { children: React.ReactNode }) => {
  const { data: locations, isLoading } = useLocations();
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

  useEffect(() => {
    if (locations && locations.length > 0 && !selectedLocation) {
      setSelectedLocation(locations[0]);
    }
  }, [locations, selectedLocation]);

  return (
    <LocationContext.Provider 
      value={{
        selectedLocation,
        setSelectedLocation,
        locations: locations || [],
        isLoading
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocationContext = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocationContext must be used within a LocationProvider');
  }
  return context;
};
