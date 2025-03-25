import React from "react";
import { Box, HStack, Pressable, Text } from "@/../components/ui";
import { Home, QrCode, Calendar, Settings } from "lucide-react-native";

interface BottomTab {
  label: string;
  value: string;
  icon: string;
  disabled?: boolean;
}

interface MobileBottomTabsProps {
  bottomTabs: BottomTab[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const MobileBottomTabs: React.FC<MobileBottomTabsProps> = ({
  bottomTabs,
  activeTab,
  setActiveTab,
}) => {
  const getIcon = (icon: string, isActive: boolean) => {
    const color = isActive ? "#2563EB" : "#6B7280";
    const size = 24;

    switch (icon) {
      case "home":
        return <Home size={size} color={color} />;
      case "qrcode":
        return <QrCode size={size} color={color} />;
      case "calendar":
        return <Calendar size={size} color={color} />;
      case "settings":
        return <Settings size={size} color={color} />;
      default:
        return <Home size={size} color={color} />;
    }
  };

  return (
    <HStack className="justify-between w-full px-6">
      {bottomTabs.map((tab: BottomTab) => {
        const isDisabled = tab.disabled;
        return (
          <Pressable
            key={tab.label}
            onPress={() => !isDisabled && setActiveTab(tab.label)}
            className={`items-center ${isDisabled ? "opacity-50" : ""}`}
            disabled={isDisabled}
          >
            <Box
              className={`p-2 rounded-lg ${
                activeTab === tab.label && !isDisabled
                  ? "bg-primary-50"
                  : "bg-transparent"
              }`}
            >
              {getIcon(tab.icon, activeTab === tab.label && !isDisabled)}
            </Box>
            <Text
              size="xs"
              className={
                isDisabled
                  ? "text-outline-200"
                  : activeTab === tab.label
                  ? "text-primary-900"
                  : "text-outline-400"
              }
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </HStack>
  );
};

export default MobileBottomTabs;
