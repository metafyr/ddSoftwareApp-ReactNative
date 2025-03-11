import * as Linking from "expo-linking";
import Constants from "expo-constants";
import { Platform } from "react-native";

// Load environment variables
const getEnvVar = (key: string, defaultValue?: string): string => {
  // For Expo, use Constants.expoConfig.extra
  if (Constants.expoConfig?.extra && key in Constants.expoConfig.extra) {
    return Constants.expoConfig.extra[key] as string;
  }

  // For React Native, use process.env
  try {
    // @ts-ignore - Using dynamic access for environment variables
    const envValue = process.env?.[key];
    if (envValue) return envValue;
  } catch (e) {
    // Ignore errors accessing process.env
  }

  return defaultValue || "";
};

// Auth configuration from environment variables
export const AUTH_CONFIG = {
  REGION: getEnvVar("COGNITO_REGION", "ap-southeast-1"),
  USER_POOL_ID: getEnvVar("COGNITO_USER_POOL_ID", "ap-southeast-1_XX22WP3of"),
  USER_POOL_CLIENT_ID: getEnvVar(
    "COGNITO_USER_POOL_CLIENT_ID",
    "5g0q735m3dbdm514b0guko803p"
  ),
  COGNITO_DOMAIN: getEnvVar(
    "COGNITO_DOMAIN",
    "https://public.auth.ap-southeast-1.amazoncognito.com"
  ),
  // These will be dynamically updated based on Expo Linking
  REDIRECT_SIGN_IN: getEnvVar(
    "COGNITO_REDIRECT_SIGN_IN",
    "ddsoftware://signin/"
  ),
  REDIRECT_SIGN_OUT: getEnvVar(
    "COGNITO_REDIRECT_SIGN_OUT",
    "ddsoftware://signout/"
  ),
};

export const getAuthConfig = () => {
  const userPoolUrl = `${AUTH_CONFIG.COGNITO_DOMAIN}`;

  return {
    clientId: AUTH_CONFIG.USER_POOL_CLIENT_ID,
    redirectUri: AUTH_CONFIG.REDIRECT_SIGN_IN,
    logoutUri: AUTH_CONFIG.REDIRECT_SIGN_OUT,
    discoveryDocument: {
      authorizationEndpoint: `${userPoolUrl}/oauth2/authorize`,
      tokenEndpoint: `${userPoolUrl}/oauth2/token`,
      revocationEndpoint: `${userPoolUrl}/oauth2/revoke`,
    },
  };
};

// Function to update auth configuration with production values
// This would be called with values from a secure source
export const updateAuthConfig = (config: Partial<typeof AUTH_CONFIG>) => {
  Object.assign(AUTH_CONFIG, config);
};
