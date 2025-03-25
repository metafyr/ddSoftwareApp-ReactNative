/**
 * API Configuration
 *
 * This file contains configuration for the API client.
 * Values are set based on environment variables if available.
 */

import { API_URL } from "@env";

const getBaseUrl = () => {
  console.log("Current API_URL:", API_URL);

  if (API_URL) {
    return API_URL;
  }
  // Local development default
  return "http://10.0.2.2:3001";
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
  SECURE: process.env.NODE_ENV === "production", // This is still fine as NODE_ENV is a React Native system variable
};
