import { ApiError } from "./apiError";
import { Platform } from "react-native";

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  headers?: Record<string, string>;
  body?: any;
}

export class ApiClient {
  private baseUrl: string;
  private authToken: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    console.log("[ApiClient] Initialized with base URL:", baseUrl);
  }

  setAuthToken(token: string | null) {
    this.authToken = token;
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    console.log(
      `[ApiClient] Making ${options.method || "GET"} request to: ${url}`
    );

    // Determine if this is a multipart/form-data request
    const isMultipartFormData =
      options.headers &&
      options.headers["Content-Type"] &&
      options.headers["Content-Type"].includes("multipart/form-data");

    // For multipart requests, it's better to let fetch set the Content-Type with boundary
    let headers: Record<string, string> = {
      ...(this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {}),
      ...options.headers,
    };

    // Only add Content-Type for non-multipart requests
    if (!isMultipartFormData && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }

    try {
      console.log("[ApiClient] Request headers:", {
        ...headers,
        Authorization: this.authToken ? "Bearer [REDACTED]" : "None",
      });

      // Don't stringify the body if it's a multipart/form-data request
      const body = isMultipartFormData
        ? options.body
        : options.body
        ? JSON.stringify(options.body)
        : undefined;

      // Enhanced fetch with timeout and retry logic
      const timeoutDuration = 30000; // 30 seconds timeout
      let retryCount = 0;
      const maxRetries = 2;

      // Function to perform the fetch with timeout
      const fetchWithTimeout = async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);

        try {
          const response = await fetch(url, {
            method: options.method || "GET",
            headers,
            body,
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          return response;
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }
      };

      let response;
      let lastError;

      // Try the request up to maxRetries times
      while (retryCount <= maxRetries) {
        try {
          // Log device information on retries
          if (retryCount > 0) {
            console.log(
              `[ApiClient] Retry attempt ${retryCount}/${maxRetries}`
            );
            console.log(`[ApiClient] Platform: ${Platform.OS}`);
            console.log(`[ApiClient] Is multipart: ${isMultipartFormData}`);
          }

          response = await fetchWithTimeout();

          if (!response.ok) {
            console.error(
              `[ApiClient] Request failed with status: ${response.status} ${response.statusText}`
            );

            // For 422 errors, try to get more detailed information about what's invalid
            if (response.status === 422) {
              try {
                const errorText = await response.text();
                console.error(`[ApiClient] 422 Error details: ${errorText}`);
              } catch (e) {
                console.error("[ApiClient] Could not read 422 error details");
              }
            }

            throw await this.handleErrorResponse(response);
          }

          // If we got here, the request succeeded
          break;
        } catch (error) {
          // Type-safe error handling
          lastError = error as Error;
          const errorMessage =
            error instanceof Error ? error.message : String(error);

          // Only retry network errors
          if (
            errorMessage &&
            (errorMessage.includes("Network request failed") ||
              errorMessage.includes("timeout") ||
              errorMessage.includes("aborted"))
          ) {
            retryCount++;
            if (retryCount <= maxRetries) {
              // Wait before retrying (exponential backoff)
              const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 5000);
              console.log(
                `[ApiClient] Network error, retrying in ${delay}ms...`
              );
              await new Promise((resolve) => setTimeout(resolve, delay));
              continue;
            }
          }

          // For non-network errors or if we've exhausted retries, just throw
          this.handleRequestError(error);
          throw error;
        }
      }

      // If the response is 204 No Content or has empty body, return null
      if (response!.status === 204 || response!.headers.get('content-length') === '0') {
        return null;
      }
      
      // Otherwise parse the response as JSON
      const data = await response!.json();
      return data;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  private async handleErrorResponse(response: Response): Promise<ApiError> {
    let errorData;
    try {
      errorData = await response.json();
    } catch (e) {
      errorData = { message: "Unknown error occurred" };
    }

    return new ApiError(
      errorData.message || `Error ${response.status}: ${response.statusText}`,
      response.status,
      errorData
    );
  }

  private handleRequestError(error: any): void {
    console.error(
      "[ApiClient] Request failed:",
      error instanceof Error ? error.message : error
    );
    // Additional error logging or monitoring could be added here
  }
}

// Import environment variables from a config file instead of using process.env directly
import { API_CONFIG } from "@config/apiConfig";

export const apiClient = new ApiClient(API_CONFIG.BASE_URL);
