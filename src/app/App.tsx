import "../../global.css";
import React, { useEffect } from "react";
import { Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import "react-native-reanimated";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as Notifications from "expo-notifications";
import { AppProviders } from "./providers";
import { AppNavigator } from "./navigation";
import { initializeApiConfig } from "@/config/apiConfig";

// Initialize WebBrowser for auth session
WebBrowser.maybeCompleteAuthSession();

// Configure notification handling
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function App() {
  // Initialize API config and permissions
  useEffect(() => {
    async function initialize() {
      try {
        // Initialize API configuration
        await initializeApiConfig();
      } catch (error) {
        console.error("Error initializing API config:", error);
      }

      // Get notification permissions
      try {
        const { status: existingStatus } =
          await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== "granted") {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus === "granted") {
          // Set up notification response handler
          const subscription =
            Notifications.addNotificationResponseReceivedListener((response) => {
              const url = response.notification.request.content.data?.url;
              if (url) {
                Linking.openURL(url);
              }
            });

          return () => {
            subscription.remove();
          };
        }
      } catch (error) {
        console.error("Error initializing notifications:", error);
      }
    }

    initialize();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProviders>
        <AppNavigator />
      </AppProviders>
    </GestureHandlerRootView>
  );
}
