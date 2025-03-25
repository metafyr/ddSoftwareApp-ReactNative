import React from "react";
import {
  Box,
  HStack,
  VStack,
  Text,
  Icon,
  Badge,
  BadgeText,
  Select,
  SelectTrigger,
  SelectInput,
  SelectPortal,
  SelectBackdrop,
  SelectContent,
  SelectItem,
} from "@/../components/ui";
import { Activity, Settings, ChevronDown } from "lucide-react-native";
import { Location } from "@shared/types";

interface HeaderProps {
  currentLocation: Location;
  onLocationChange: (location: Location) => void;
  locations: Location[];
  userName: string;
  userRole: string;
  activeTab: string;
}

export function Header({
  currentLocation,
  onLocationChange,
  locations,
  userName,
  userRole,
  activeTab,
}: HeaderProps) {
  if (activeTab === "Settings") {
    return null;
  }

  return (
    <Box className="z-50">
      <Box
        className={`bg-primary-600 px-4 ${
          activeTab === "Dashboard" ? "pt-8 pb-4" : "py-4"
        }`}
      >
        {activeTab === "Dashboard" && (
          <HStack className="justify-between mb-3">
            <HStack space="md">
              <Box className="w-10 h-10 bg-white rounded-full items-center justify-center">
                <Text className="text-primary-600 font-bold">
                  {userName.charAt(0)}
                </Text>
              </Box>
              <VStack>
                <Text className="text-sm text-primary-100">Welcome back,</Text>
                <Text className="text-lg font-semibold text-white">
                  {userName}
                </Text>
              </VStack>
            </HStack>
            <Badge
              size="md"
              variant="solid"
              action="muted"
              className="rounded-full bg-primary-400 px-4"
            >
              <BadgeText className="text-white font-bold">{userRole}</BadgeText>
            </Badge>
          </HStack>
        )}

        <Box
          className={`relative ${activeTab === "Dashboard" ? "mt-3" : "mt-0"}`}
        >
          <Select
            selectedValue={currentLocation.id}
            onValueChange={(value) => {
              const selectedLocation = locations.find(
                (loc) => loc.id === value
              );
              if (selectedLocation) {
                onLocationChange(selectedLocation);
              }
            }}
          >
            <SelectTrigger className="rounded-xl border-0 py-7 bg-white/10">
              <HStack className="items-center justify-between w-full pr-6 pl-3">
                <HStack space="sm">
                  <Box className="w-8 h-8 bg-primary-400 rounded-lg items-center justify-center">
                    <Icon as={Activity} size="sm" color="white" />
                  </Box>
                  <VStack>
                    <Text className="text-xs text-primary-100">
                      Current Location
                    </Text>
                    <Text className="font-medium text-white">
                      {currentLocation.name}
                    </Text>
                  </VStack>
                </HStack>
                <Icon as={ChevronDown} size="sm" color="white" />
              </HStack>
            </SelectTrigger>
            <SelectPortal>
              <SelectBackdrop />
              <SelectContent>
                {locations.map((location) => (
                  <SelectItem
                    key={location.id}
                    label={location.name}
                    value={location.id}
                  />
                ))}
                <SelectItem
                  key="manage"
                  label="Manage Locations"
                  value="manage"
                >
                  <HStack space="sm" className="items-center">
                    <Icon as={Settings} size="sm" color="#2563eb" />
                    <Text>Manage Locations</Text>
                  </HStack>
                </SelectItem>
              </SelectContent>
            </SelectPortal>
          </Select>
        </Box>
      </Box>
    </Box>
  );
}
