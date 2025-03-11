/**
 * API Configuration
 *
 * This file contains configuration for the API client.
 * Values are set based on environment variables if available.
 */

const getBaseUrl = () => {
  // In production, this would come from environment variables
  if (process.env.API_URL) {
    return process.env.API_URL;
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
  SECURE: process.env.NODE_ENV === "production",
};
