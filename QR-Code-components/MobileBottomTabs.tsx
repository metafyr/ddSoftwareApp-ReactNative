import React from "react";
import { Box, HStack, Icon, Pressable, Text } from "../components/ui";
import { Home, QrCode, Calendar, Settings } from "lucide-react-native";

const iconMap: any = {
  home: Home,
  qrcode: QrCode,
  calendar: Calendar,
  settings: Settings,
};

const MobileBottomTabs = ({ activeTab, setActiveTab, bottomTabs }: any) => {
  return (
    <HStack className="justify-between w-full px-6">
      {bottomTabs.map((tab: any) => {
        const IconComponent = iconMap[tab.icon];
        return (
          <Pressable
            key={tab.label}
            onPress={() => setActiveTab(tab.label)}
            className="items-center"
          >
            <Box
              className={`p-2 rounded-lg ${
                activeTab === tab.label ? "bg-primary-50" : "bg-transparent"
              }`}
            >
              <Icon
                as={IconComponent}
                size="lg"
                color={activeTab === tab.label ? "#0F172A" : "#94A3B8"}
              />
            </Box>
            <Text
              size="xs"
              className={
                activeTab === tab.label
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
