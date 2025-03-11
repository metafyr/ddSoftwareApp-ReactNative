import "./global.css";
import React, { useEffect } from "react";
import { SafeAreaView, GluestackUIProvider } from "./components/ui";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import "react-native-reanimated";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { getAuthConfig } from "./src/auth/authConfig";
import AuthNavigator from "./src/navigation/AuthNavigator";
import { LocationProvider } from "./src/context/LocationContext";

let defaultTheme: "dark" | "light" = "light";

Linking.getInitialURL().then((url: any) => {
  let { queryParams } = Linking.parse(url) as any;
  defaultTheme = queryParams?.iframeMode ?? defaultTheme;
});

type ThemeContextType = {
  colorMode?: "dark" | "light";
  toggleColorMode?: () => void;
};

export const ThemeContext = React.createContext<ThemeContextType>({
  colorMode: "light",
  toggleColorMode: () => {},
});

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Initialize WebBrowser for auth session
WebBrowser.maybeCompleteAuthSession();

export default function App() {
  const [colorMode, setColorMode] = React.useState<"dark" | "light">(
    defaultTheme
  );

  const toggleColorMode = async () => {
    setColorMode((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <>
      {/* top SafeAreaView */}
      <SafeAreaView
        className={`${colorMode === "light" ? "bg-[#E5E5E5]" : "bg-[#262626]"}`}
      />
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeContext.Provider value={{ colorMode, toggleColorMode }}>
          <QueryClientProvider client={queryClient}>
            <GluestackUIProvider mode={colorMode}>
              {/* bottom SafeAreaView */}
              <SafeAreaView
                className={`${
                  colorMode === "light" ? "bg-white" : "bg-[#171717]"
                } flex-1 overflow-hidden`}
              >
                <LocationProvider>
                  <AuthNavigator />
                </LocationProvider>
              </SafeAreaView>
            </GluestackUIProvider>
          </QueryClientProvider>
        </ThemeContext.Provider>
      </GestureHandlerRootView>
    </>
  );
}
