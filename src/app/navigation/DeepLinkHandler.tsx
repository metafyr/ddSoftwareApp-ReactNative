import React, { useEffect } from "react";
import * as Linking from "expo-linking";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "@shared/types";

/**
 * Component that handles deep links in the application
 * This is a non-visual component that should be mounted at the root level
 */
const DeepLinkHandler: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    // Function to handle deep link URLs
    const handleDeepLink = (url: string) => {
      const parsed = Linking.parse(url);

      // Handle physical QR code URLs
      // Check if hostname is 'physical' or if path starts with 'physical/'
      if (
        (parsed.hostname === "physical" && parsed.path) ||
        (parsed.path && parsed.path.startsWith("physical/"))
      ) {
        let qrId = parsed.path;
        if (parsed.path.startsWith("physical/")) {
          qrId = parsed.path.replace("physical/", "");
        }

        navigation.navigate("QRScanPage", {
          qrId: qrId,
        });
      }
    };

    // Handle the initial URL that opened the app
    const getInitialURL = async () => {
      const url = await Linking.getInitialURL();
      if (url) {
        handleDeepLink(url);
      }
    };

    // Set up a listener for when the app is opened via a deep link while already running
    const subscription = Linking.addEventListener("url", ({ url }) => {
      handleDeepLink(url);
    });

    getInitialURL();

    return () => {
      subscription.remove();
    };
  }, [navigation]);

  // This component doesn't render anything
  return null;
};

export default DeepLinkHandler;
