/**
 * API Configuration
 *
 * This file contains configuration for the API client.
 * Values are set based on environment variables if available.
 * Enhanced with platform-specific detection and connectivity testing.
 */

import { API_URL } from "@env";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Storage key for caching the backend URL
const BACKEND_URL_KEY = "@ddSoft:backendUrl";

/**
 * Get the optimal base URL for API requests based on platform and environment
 */
const getBaseUrl = () => {
  console.log("Current API_URL from env:", API_URL);

  // If API_URL is explicitly set in environment, use it
  if (API_URL) {
    return API_URL;
  }

  // For local development, use platform-specific default
  if (Platform.OS === "android") {
    return "http://10.0.2.2:3001"; // Android emulator
  } else {
    return "http://localhost:3001"; // iOS simulator
  }
};

/**
 * Test connectivity to a specific URL
 * @param url URL to test
 * @returns Promise resolving to boolean indicating if connection was successful
 */
export const testUrlConnectivity = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(`${url}/health`, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(3000), // 3 second timeout
    });
    return response.ok;
  } catch (error) {
    console.log(`Failed to connect to ${url}:`, error);
    return false;
  }
};

/**
 * Test connectivity to common backend URLs and return the first working one
 * @returns Promise resolving to a working URL or null if none found
 */
export const findWorkingBackendUrl = async (): Promise<string | null> => {
  const urlsToTest = [
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "http://10.0.2.2:3001", // Android emulator
    "http://10.0.3.2:3001", // Genymotion emulator
  ];

  for (const url of urlsToTest) {
    console.log(`Testing connectivity to ${url}...`);
    const isConnected = await testUrlConnectivity(url);
    if (isConnected) {
      console.log(`Successfully connected to ${url}`);
      return url;
    }
  }

  console.warn("Could not connect to any backend URL");
  return null;
};

/**
 * Initialize API configuration with connectivity testing
 * Call this during app startup to ensure backend connectivity
 */
export const initializeApiConfig = async (): Promise<void> => {
  try {
    // Try to get cached URL first
    const cachedUrl = await AsyncStorage.getItem(BACKEND_URL_KEY);

    if (cachedUrl) {
      // Verify the cached URL still works
      const isConnected = await testUrlConnectivity(cachedUrl);
      if (isConnected) {
        console.log(`Using cached backend URL: ${cachedUrl}`);
        API_CONFIG.BASE_URL = cachedUrl;
        return;
      }
    }

    // Try to find a working URL
    const workingUrl = await findWorkingBackendUrl();
    if (workingUrl) {
      API_CONFIG.BASE_URL = workingUrl;

      // Cache the working URL for future use
      await AsyncStorage.setItem(BACKEND_URL_KEY, workingUrl);
    }
  } catch (error) {
    console.error("Error initializing API config:", error);
    // Fall back to default URL if initialization fails
  }
};

/**
 * Set a specific backend URL
 * @param url URL to set as backend
 */
export const setBackendUrl = async (url: string): Promise<void> => {
  API_CONFIG.BASE_URL = url;
  await AsyncStorage.setItem(BACKEND_URL_KEY, url);
  console.log(`Backend URL set to: ${url}`);
};

/**
 * Get a complete API URL by combining the base URL with an endpoint path
 * @param endpoint API endpoint path
 * @returns Full API URL
 */
export const getApiUrl = (endpoint: string): string => {
  // Ensure endpoint starts with /
  const normalizedEndpoint = endpoint.startsWith("/")
    ? endpoint
    : `/${endpoint}`;

  return `${API_CONFIG.BASE_URL}${normalizedEndpoint}`;
};

export const API_CONFIG = {
  // Base URL for API requests
  BASE_URL: getBaseUrl(),

  // API version
  API_VERSION: "v1",

  // Request timeout in milliseconds
  TIMEOUT: 30000,

  // Default headers to include with all requests
  DEFAULT_HEADERS: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },

  // Security settings
  SECURE: process.env.NODE_ENV === "production",
};
