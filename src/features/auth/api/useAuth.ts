import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as WebBrowser from "expo-web-browser";
import {
  useAuthRequest,
  exchangeCodeAsync,
  revokeAsync,
  refreshAsync,
  ResponseType,
} from "expo-auth-session";
import { useState, useEffect, useMemo } from "react";
import { apiClient } from "@shared/api/client";
import { API_ENDPOINTS } from "@shared/api/endpoints";
import { User } from "@shared/types";
import { getAuthConfig } from "../config/authConfig";
import * as SecureStore from "expo-secure-store";
import { useNavigation } from "@react-navigation/native";
import Constants from "expo-constants";

WebBrowser.maybeCompleteAuthSession();

// Define the type for auth tokens
type AuthTokens = {
  accessToken?: string;
  idToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType?: string;
  issuedAt?: number; // Timestamp when the token was issued
};

// Define storage keys
const AUTH_TOKENS_KEY = "auth_tokens";
const APP_VERSION_KEY = "app_version";

// Store auth tokens in memory
let authTokensStore: AuthTokens | null = null;

/**
 * Check if app version has changed and perform cleanup if needed
 * @returns Promise resolving to boolean indicating if version changed
 */
const checkAppVersionAndCleanup = async (): Promise<boolean> => {
  try {
    // Get current app version from Expo Constants
    const currentVersion = Constants.expoConfig?.version || "1.0.0";

    // Get stored version
    const storedVersion = await SecureStore.getItemAsync(APP_VERSION_KEY);

    // If versions don't match or no stored version, cleanup and update
    if (!storedVersion || storedVersion !== currentVersion) {
      console.log(
        `App version changed: ${
          storedVersion || "none"
        } -> ${currentVersion}. Clearing auth tokens.`
      );

      // Clear the tokens
      await SecureStore.deleteItemAsync(AUTH_TOKENS_KEY);
      authTokensStore = null;

      // Store new version
      await SecureStore.setItemAsync(APP_VERSION_KEY, currentVersion);

      return true;
    }

    return false;
  } catch (error) {
    console.error("[checkAppVersionAndCleanup] Error:", error);
    return false;
  }
};

/**
 * Save auth tokens to secure storage
 * @param tokens Auth tokens to save
 */
const saveAuthTokens = async (tokens: AuthTokens | null): Promise<void> => {
  try {
    if (tokens) {
      // Add issuedAt timestamp if not present
      if (!tokens.issuedAt) {
        tokens.issuedAt = Date.now();
      }
      await SecureStore.setItemAsync(AUTH_TOKENS_KEY, JSON.stringify(tokens));
    } else {
      await SecureStore.deleteItemAsync(AUTH_TOKENS_KEY);
    }
  } catch (error) {
    console.error("[saveAuthTokens] Error saving auth tokens:", error);
  }
};

/**
 * Load auth tokens from secure storage
 * @returns Auth tokens or null if not found
 */
const loadAuthTokens = async (): Promise<AuthTokens | null> => {
  try {
    const tokensString = await SecureStore.getItemAsync(AUTH_TOKENS_KEY);
    return tokensString ? JSON.parse(tokensString) : null;
  } catch (error) {
    console.error("[loadAuthTokens] Error loading auth tokens:", error);
    return null;
  }
};

/**
 * Check if token is expired
 * @param tokens Auth tokens
 * @returns True if token is expired or about to expire
 */
const isTokenExpired = (tokens: AuthTokens): boolean => {
  if (!tokens.expiresIn || !tokens.issuedAt) {
    return true; // If we don't have expiration info, assume expired
  }

  // Get current time
  const now = Date.now();

  // Calculate expiration time (convert expiresIn from seconds to milliseconds)
  const expirationTime = tokens.issuedAt + tokens.expiresIn * 1000;

  // Increase buffer time to 15 minutes for more conservative refreshing
  const bufferTime = 15 * 60 * 1000; // 15 minutes in milliseconds

  const isExpired = now > expirationTime - bufferTime;

  if (isExpired) {
    console.log(
      `Token will expire in ${Math.floor(
        (expirationTime - now) / 1000 / 60
      )} minutes. Considering as expired.`
    );
  }

  return isExpired;
};

/**
 * Extract email from JWT token
 * @param token JWT token
 * @returns email or null if not found
 */
const extractEmailFromToken = (token: string): string | null => {
  try {
    // JWT tokens are in the format: header.payload.signature
    const parts = token.split(".");
    if (parts.length !== 3) {
      console.error("[extractEmailFromToken] Invalid token format");
      return null;
    }

    // Decode the payload (middle part)
    const base64Url = parts[1];
    // Handle any base64url encoding
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");

    // Safer way to decode base64 in React Native
    let payload;
    try {
      // Simple approach first
      const rawPayload = atob(base64);
      payload = JSON.parse(rawPayload);
    } catch (e) {
      console.warn(
        "[extractEmailFromToken] Simple decode failed, trying alternative method"
      );
      try {
        // Alternative approach if the simple one fails
        const rawData = atob(base64);
        const strData = Array.from(rawData)
          .map((char) => char.charCodeAt(0))
          .map((byte) => String.fromCharCode(byte))
          .join("");
        payload = JSON.parse(strData);
      } catch (innerError) {
        console.error(
          "[extractEmailFromToken] Alternative decode failed:",
          innerError
        );
        throw innerError;
      }
    }

    // Try various common claims for email
    const email =
      payload.email || payload.mail || payload["cognito:email"] || null;

    return email;
  } catch (error) {
    console.error(
      "[extractEmailFromToken] Error extracting email from token:",
      error
    );
    return null;
  }
};

export const useAuth = () => {
  const [authTokens, setAuthTokens] =
    useState<typeof authTokensStore>(authTokensStore);
  const [isLoadingTokens, setIsLoadingTokens] = useState(true);
  const navigation = useNavigation();

  // Try to extract email from both token types, but prefer access token
  const email = authTokens?.accessToken
    ? extractEmailFromToken(authTokens.accessToken) ||
      (authTokens?.idToken ? extractEmailFromToken(authTokens.idToken) : null)
    : authTokens?.idToken
    ? extractEmailFromToken(authTokens.idToken)
    : null;
  const queryClient = useQueryClient();
  const config = useMemo(() => getAuthConfig(), []);
  const discoveryDocument = useMemo(() => config.discoveryDocument, [config]);

  // Load tokens from storage on initialization
  useEffect(() => {
    const initializeTokens = async () => {
      try {
        setIsLoadingTokens(true);

        // Check if app version has changed and clear tokens if needed
        const versionChanged = await checkAppVersionAndCleanup();
        if (versionChanged) {
          console.log("App version changed, tokens cleared");
          queryClient.invalidateQueries({ queryKey: ["currentUser"] });
          queryClient.invalidateQueries({ queryKey: ["isAuthenticated"] });
          setIsLoadingTokens(false);
          return;
        }

        const storedTokens = await loadAuthTokens();

        if (storedTokens) {
          console.log("Found stored auth tokens");

          // Check if token needs refresh
          if (storedTokens.refreshToken && isTokenExpired(storedTokens)) {
            console.log("Token expired, attempting to refresh");

            try {
              const refreshResult = await refreshAsync(
                {
                  clientId: config.clientId,
                  refreshToken: storedTokens.refreshToken,
                },
                discoveryDocument
              );

              // Add issuedAt timestamp
              refreshResult.issuedAt = Date.now();

              // Update tokens
              authTokensStore = refreshResult;
              await saveAuthTokens(refreshResult);
              setAuthTokens(refreshResult);
              console.log("Token refreshed successfully");
            } catch (refreshError) {
              console.error("Error refreshing token:", refreshError);

              // Clear the expired tokens instead of reusing them
              console.log("Clearing expired tokens due to refresh failure");
              authTokensStore = null;
              await saveAuthTokens(null);
              setAuthTokens(null);

              // Don't redirect here - the app will detect missing tokens
              // and redirect as needed based on authentication state
            }
          } else {
            // Use stored tokens as-is
            authTokensStore = storedTokens;
            setAuthTokens(storedTokens);
          }

          // Invalidate queries to trigger refetch with new token
          queryClient.invalidateQueries({ queryKey: ["currentUser"] });
          queryClient.invalidateQueries({ queryKey: ["isAuthenticated"] });
        }
      } catch (error) {
        console.error("Error initializing tokens:", error);
      } finally {
        setIsLoadingTokens(false);
      }
    };

    initializeTokens();
  }, [config.clientId, discoveryDocument, queryClient]);

  // Add debugging logs for authentication state
  useEffect(() => {
    if (!isLoadingTokens) {
      console.log("Auth state:", {
        hasAccessToken: !!authTokens?.accessToken,
        accessTokenLength: authTokens?.accessToken
          ? authTokens.accessToken.length
          : 0,
        hasIdToken: !!authTokens?.idToken,
        tokenTypes: authTokens
          ? Object.keys(authTokens).filter(
              (key) =>
                ["accessToken", "idToken", "refreshToken"].includes(key) &&
                !!authTokens[key as keyof AuthTokens]
            )
          : [],
        email,
        tokensLoaded: !isLoadingTokens,
      });

      if (authTokens?.accessToken) {
        console.log(
          "AccessToken prefix:",
          authTokens.accessToken.substring(0, 20) + "..."
        );
      }
    }
  }, [isLoadingTokens, authTokens, email]);

  return useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      if (!authTokens?.accessToken || !email) {
        console.log("Skipping API call - missing token or email:", {
          hasAccessToken: !!authTokens?.accessToken,
          email,
        });
        return null;
      }

      console.log(
        "Setting access token for API request, token length:",
        authTokens.accessToken.length
      );
      apiClient.setAuthToken(authTokens.accessToken);

      console.log("Making API request to:", API_ENDPOINTS.USER_BY_EMAIL(email));
      try {
        const user = await apiClient.request<User>(
          API_ENDPOINTS.USER_BY_EMAIL(email)
        );
        console.log("API request successful, received user data");
        return user;
      } catch (error) {
        console.error("API request failed:", error);

        // Enhanced error handling for auth errors
        if (error && typeof error === "object" && "status" in error) {
          const apiError = error as { status: number };

          if (apiError.status === 401) {
            console.log(
              "Authentication failed - token likely expired or invalid"
            );

            // Clear tokens to force re-login
            authTokensStore = null;
            await saveAuthTokens(null);
            setAuthTokens(null);

            // Invalidate queries
            queryClient.invalidateQueries({ queryKey: ["currentUser"] });
            queryClient.invalidateQueries({ queryKey: ["isAuthenticated"] });

            // Navigate after a short delay
            setTimeout(() => {
              navigation.navigate("Login" as never);
            }, 300);

            throw new Error("Session expired. Please log in again.");
          } else if (apiError.status === 404) {
            // Navigate to the UserNotFound screen
            console.log(
              "User not found in system, redirecting to UserNotFound screen"
            );
            setTimeout(() => {
              navigation.navigate("UserNotFound" as never);
            }, 300);
          }
        }

        throw error;
      }
    },
    enabled: !isLoadingTokens && !!authTokens?.accessToken && !!email,
  });
};

export const useSignIn = () => {
  const queryClient = useQueryClient();
  const config = useMemo(() => getAuthConfig(), []);
  const [authTokens, setAuthTokens] =
    useState<typeof authTokensStore>(authTokensStore);
  const discoveryDocument = useMemo(() => config.discoveryDocument, [config]);

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: config.clientId,
      responseType: ResponseType.Code,
      redirectUri: config.redirectUri,
      usePKCE: true,
    },
    discoveryDocument
  );

  useEffect(() => {
    const exchangeFn = async (exchangeTokenReq: any) => {
      try {
        const exchangeTokenResponse = await exchangeCodeAsync(
          exchangeTokenReq,
          discoveryDocument
        );

        // Add issuedAt timestamp
        exchangeTokenResponse.issuedAt = Date.now();

        // Store tokens in memory
        authTokensStore = exchangeTokenResponse;

        // Store tokens in secure storage
        await saveAuthTokens(exchangeTokenResponse);

        // Update state
        setAuthTokens(exchangeTokenResponse);

        // Invalidate queries
        queryClient.invalidateQueries({ queryKey: ["currentUser"] });
        queryClient.invalidateQueries({ queryKey: ["isAuthenticated"] });

        console.log("Authentication successful, tokens stored securely");
      } catch (error) {
        console.error("Error exchanging code for token:", error);
      }
    };

    if (response && "type" in response) {
      if (response.type === "error" && "error" in response) {
        console.error(
          "Authentication error",
          response.error || "something went wrong"
        );
        return;
      }

      if (
        response.type === "success" &&
        "params" in response &&
        response.params.code
      ) {
        exchangeFn({
          clientId: config.clientId,
          code: response.params.code,
          redirectUri: config.redirectUri,
          extraParams: {
            code_verifier: request?.codeVerifier,
          },
        });
      }
    }
  }, [
    discoveryDocument,
    request,
    response,
    queryClient,
    config.clientId,
    config.redirectUri,
    setAuthTokens,
  ]);

  return useMutation({
    mutationFn: async (provider?: string) => {
      try {
        console.log("Starting sign-in process...");
        await promptAsync();
        return true;
      } catch (error) {
        console.error("Error signing in:", JSON.stringify(error, null, 2));
        throw error;
      }
    },
  });
};

export const useSignOut = () => {
  const queryClient = useQueryClient();
  const config = useMemo(() => getAuthConfig(), []);
  const discoveryDocument = useMemo(() => config.discoveryDocument, [config]);
  const [, setAuthTokens] = useState<typeof authTokensStore>(authTokensStore);

  return useMutation({
    mutationFn: async () => {
      try {
        if (authTokensStore?.refreshToken) {
          await revokeAsync(
            {
              clientId: config.clientId,
              token: authTokensStore.refreshToken,
            },
            discoveryDocument
          );
        }

        // Clear tokens from memory
        authTokensStore = null;

        // Clear tokens from secure storage
        await saveAuthTokens(null);

        // Update state
        setAuthTokens(null);
        apiClient.setAuthToken(null);

        console.log("Sign out successful, tokens cleared");
        return true;
      } catch (error) {
        console.error("Error signing out:", error);
        throw error;
      }
    },
    onSuccess: () => {
      // Clear the current user from the cache
      queryClient.setQueryData(["currentUser"], null);
      queryClient.invalidateQueries({ queryKey: ["isAuthenticated"] });
    },
  });
};

export const useIsAuthenticated = () => {
  const [isChecking, setIsChecking] = useState(true);

  return useQuery({
    queryKey: ["isAuthenticated"],
    queryFn: async () => {
      setIsChecking(true);

      // First check memory
      if (authTokensStore?.accessToken) {
        console.log("Auth in memory: access token found");
        setIsChecking(false);
        return true;
      }

      // If not in memory, try to load from storage
      try {
        console.log("Checking stored tokens");
        const storedTokens = await loadAuthTokens();
        if (storedTokens) {
          console.log(
            "Found stored tokens with:",
            Object.keys(storedTokens).filter(
              (key) =>
                ["accessToken", "idToken", "refreshToken"].includes(key) &&
                !!storedTokens[key as keyof AuthTokens]
            )
          );

          if (storedTokens.accessToken) {
            // Update memory store
            console.log("Valid access token found in storage");
            authTokensStore = storedTokens;
            setIsChecking(false);
            return true;
          } else {
            console.log("No access token found in stored tokens");
          }
        } else {
          console.log("No stored tokens found");
        }
      } catch (error) {
        console.error("Error checking authentication status:", error);
      }

      setIsChecking(false);
      return false;
    },
    // Refetch on component mount
    refetchOnMount: true,
  });
};

// For backward compatibility
export const useSignInWithGoogle = useSignIn;
