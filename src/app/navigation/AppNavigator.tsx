import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useIsAuthenticated } from "@features/auth/api";
import { SignInScreen } from "@features/auth/screens";
import { RootStackParamList } from "@shared/types";
import DeepLinkHandler from "./DeepLinkHandler";
import { MainPage } from "./MainPage";
import { LoadingScreen, ErrorScreen } from "@/shared/ui";

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  const {
    data: isAuthenticated,
    isLoading,
    error,
    refetch,
  } = useIsAuthenticated();

  const [splashVisible, setSplashVisible] = useState(true);

  // Hide splash screen after a short delay to allow auth check to complete
  useEffect(() => {
    const timer = setTimeout(() => {
      setSplashVisible(false);
    }, 1500); // 1.5 seconds delay

    return () => clearTimeout(timer);
  }, []);

  if (splashVisible || isLoading) {
    return <LoadingScreen message="Checking authentication status..." />;
  }

  if (error) {
    return (
      <ErrorScreen
        message="Failed to check authentication status. Please try again."
        onRetry={refetch}
      />
    );
  }

  return (
    <NavigationContainer>
      <DeepLinkHandler />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="MainDashboard" component={MainPage} />
          </>
        ) : (
          <Stack.Screen name="SignIn" component={SignInScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
