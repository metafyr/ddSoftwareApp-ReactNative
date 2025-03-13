import { ApiError } from "./apiError";

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

    const headers = {
      // Only set Content-Type to application/json if it's not a multipart/form-data request
      ...(!isMultipartFormData ? { "Content-Type": "application/json" } : {}),
      ...(this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {}),
      ...options.headers,
    };

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

      const response = await fetch(url, {
        method: options.method || "GET",
        headers,
        body,
      });

      if (!response.ok) {
        console.error(
          `[ApiClient] Request failed with status: ${response.status} ${response.statusText}`
        );
        throw await this.handleErrorResponse(response);
      }

      const data = await response.json();
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
import { API_CONFIG } from "../config/apiConfig";

export const apiClient = new ApiClient(API_CONFIG.BASE_URL);
