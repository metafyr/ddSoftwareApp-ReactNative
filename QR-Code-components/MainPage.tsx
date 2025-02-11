import React, { useEffect, useState } from "react";
import { StatusBar, Platform } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Box } from "../components/ui";
import { Header } from "./components/Header";
import { mockUser, mockLocations, currentLocation } from "../data/mockData";
import { Location } from "../types";
import MobileBottomTabs from "./MobileBottomTabs";
import Dashboard from "./pages/Dashboard";
import QRCodes from "./pages/QRCodes";
import Schedules from "./pages/Schedules";
import Settings from "./pages/Settings";
import QRCodeDetails from "./pages/QRCodeDetails";

const Stack = createNativeStackNavigator();

const bottomTabs = [
  {
    icon: "home",
    label: "Dashboard",
  },
  {
    icon: "qrcode",
    label: "QR Codes",
  },
  {
    icon: "calendar",
    label: "Schedules",
  },
  {
    icon: "settings",
    label: "Settings",
  },
];

const MainContent = () => {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [selectedLocation, setSelectedLocation] =
    useState<Location>(currentLocation);

  const handleLocationChange = (location: Location) => {
    setSelectedLocation(location);
  };

  return (
    <Box className="flex-1">
      <StatusBar />
      <Box className="flex-1">
        <Header
          currentLocation={selectedLocation}
          onLocationChange={handleLocationChange}
          locations={mockLocations}
          userName={mockUser.name}
          userRole={mockUser.role}
          activeTab={activeTab}
        />
        {activeTab === "Dashboard" && <Dashboard />}
        {activeTab === "QR Codes" && <QRCodes />}
        {activeTab === "Schedules" && <Schedules />}
        {activeTab === "Settings" && <Settings />}
      </Box>

      <Box className="h-[72px] items-center w-full flex md:hidden border-t border-outline-50">
        <MobileBottomTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          bottomTabs={bottomTabs}
        />
      </Box>
    </Box>
  );
};

const MainPage = () => {
  useEffect(() => {
    if (Platform.OS === "web") {
      document.body.style.overflow = "hidden";
      document.body.style.height = "100%";
    }
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={MainContent} />
        <Stack.Screen name="QRCodeDetails" component={QRCodeDetails} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default MainPage;
