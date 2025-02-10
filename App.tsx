import "./global.css";
import React from "react";
import MainPage from "./QR-Code-components/MainPage";
import { SafeAreaView, GluestackUIProvider } from "./components/ui";
import * as Linking from "expo-linking";
import "react-native-reanimated";

let defaultTheme: "dark" | "light" = "light";

Linking.getInitialURL().then((url: any) => {
  let { queryParams } = Linking.parse(url) as any;
  defaultTheme = queryParams?.iframeMode ?? defaultTheme;
});
import { GestureHandlerRootView } from "react-native-gesture-handler";
type ThemeContextType = {
  colorMode?: "dark" | "light";
  toggleColorMode?: () => void;
};
export const ThemeContext = React.createContext<ThemeContextType>({
  colorMode: "light",
  toggleColorMode: () => {},
});

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
          <GluestackUIProvider mode={colorMode}>
            {/* bottom SafeAreaView */}
            <SafeAreaView
              className={`${
                colorMode === "light" ? "bg-white" : "bg-[#171717]"
              } flex-1 overflow-hidden`}
            >
              <MainPage />
            </SafeAreaView>
          </GluestackUIProvider>
        </ThemeContext.Provider>
      </GestureHandlerRootView>
    </>
  );
}
