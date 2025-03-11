import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MainPage from "../../QR-Code-components/MainPage";
import SignInScreen from "../screens/SignInScreen";
import { useIsAuthenticated } from "../api/hooks/useAuth";
import LoadingScreen from "../screens/LoadingScreen";
import ErrorScreen from "../screens/ErrorScreen";
import { RootStackParamList } from "../types";

const Stack = createNativeStackNavigator<RootStackParamList>();

const AuthNavigator = () => {
  const {
    data: isAuthenticated,
    isLoading,
    error,
    refetch,
  } = useIsAuthenticated();

  if (isLoading) {
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
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="Main" component={MainPage} />
            {/* Add other authenticated screens here */}
          </>
        ) : (
          <Stack.Screen name="SignIn" component={SignInScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AuthNavigator;
