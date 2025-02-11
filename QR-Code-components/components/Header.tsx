import React, { useState } from "react";
import {
  Box,
  HStack,
  VStack,
  Text,
  Pressable,
  Icon,
  Badge,
  BadgeText,
  BadgeIcon,
} from "@/components/ui";
import {
  ChevronDown,
  Activity,
  Settings,
  GlobeIcon,
} from "lucide-react-native";
import { Location } from "../../types";

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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <Box className="z-50">
      <Box className={`bg-primary-600 px-4 ${activeTab === "Dashboard" ? "pt-8 pb-4" : "py-4"}`}>
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

        <Box className={`relative ${activeTab === "Dashboard" ? "mt-3" : "mt-0"}`}>
          <Pressable
            className="bg-white/10 rounded-xl p-3"
            onPress={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <HStack className="justify-between items-center">
              <HStack space="sm">
                <Box className="w-8 h-8 bg-primary-400 rounded-lg items-center justify-center">
                  <Icon as={Activity} size="md" color="white" />
                </Box>
                <VStack>
                  <Text className="text-xs text-primary-100">
                    Current Location
                  </Text>
                  <Text className="font-medium text-white">
                    {currentLocation.location_name}
                  </Text>
                </VStack>
              </HStack>
              <Icon
                as={ChevronDown}
                size="sm"
                color="white"
                style={{
                  transform: [{ rotate: isDropdownOpen ? "180deg" : "0deg" }],
                }}
              />
            </HStack>
          </Pressable>

          {isDropdownOpen && (
            <Box className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-200 z-50">
              {locations.map((location) => (
                <Pressable
                  key={location.location_id}
                  className="px-4 py-3"
                  onPress={() => {
                    onLocationChange(location);
                    setIsDropdownOpen(false);
                  }}
                >
                  <Text className="text-gray-800 text-sm font-medium">
                    {location.location_name}
                  </Text>
                </Pressable>
              ))}
              <Pressable className="px-4 py-3 border-t border-gray-200">
                <HStack space="sm">
                  <Icon as={Settings} size="sm" color="#2563eb" />
                  <Text className="text-primary-600 text-sm font-medium">
                    Manage Locations
                  </Text>
                </HStack>
              </Pressable>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
