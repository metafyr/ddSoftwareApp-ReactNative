import React, { useEffect, useState } from "react";
import { StatusBar, Platform } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Box } from "../components/ui";
import { Header } from "./components/Header";
import { Location } from "../src/types";
import MobileBottomTabs from "./MobileBottomTabs";
import Dashboard from "./pages/Dashboard";
import QRCodes from "./pages/QRCodes";
import Schedules from "./pages/Schedules";
import Settings from "./pages/Settings";
import QRCodeDetails from "./pages/QRCodeDetails";
import QRScanPage from "./pages/QRScanPage";
import { useAuth } from "../src/api/hooks";
import LoadingScreen from "../src/screens/LoadingScreen";
import ErrorScreen from "../src/screens/ErrorScreen";
import { useLocationContext } from "../src/context/LocationContext";

const Stack = createNativeStackNavigator();

const bottomTabs = [
  {
    label: "Dashboard",
    value: "Dashboard",
    icon: "home",
  },
  {
    label: "QR Codes",
    value: "QR Codes",
    icon: "qrcode",
  },
  {
    label: "Schedules",
    value: "Schedules",
    icon: "calendar",
    disabled: true,
  },
  {
    label: "Settings",
    value: "Settings",
    icon: "settings",
  },
];

const MainContent = () => {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const { data: user, isLoading: isUserLoading, error: userError } = useAuth();
  const {
    selectedLocation,
    setSelectedLocation,
    locations,
    isLoading: isLocationsLoading,
  } = useLocationContext();

  if (isUserLoading || isLocationsLoading) {
    return <LoadingScreen message="Loading your dashboard..." />;
  }

  if (userError || !user || !selectedLocation) {
    return (
      <ErrorScreen
        message="Failed to load user or locations data. Please try again."
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <Box className="flex-1">
      <StatusBar />
      <Box className="flex-1 flex flex-col">
        <Header
          currentLocation={selectedLocation}
          onLocationChange={setSelectedLocation}
          locations={locations}
          userName={user.name}
          userRole={user.roleName}
          activeTab={activeTab}
        />
        <Box className="flex-1 overflow-hidden">
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
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={MainContent} />
      <Stack.Screen name="QRCodeDetails" component={QRCodeDetails} />
      <Stack.Screen name="QRScanPage" component={QRScanPage} />
    </Stack.Navigator>
  );
};

export default MainPage;
