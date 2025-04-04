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

// Define storage key
const AUTH_TOKENS_KEY = "auth_tokens";

// Store auth tokens in memory
let authTokensStore: AuthTokens | null = null;

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
  const expirationTime = tokens.issuedAt + (tokens.expiresIn * 1000);
  
  // Consider token expired if it's within 5 minutes of expiration
  const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
  
  return now > expirationTime - bufferTime;
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
    if (parts.length !== 3) return null;

    // Decode the payload (middle part)
    const payload = JSON.parse(atob(parts[1]));
    return payload.email || null;
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
  const email = authTokens?.idToken
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
              // If refresh fails, we'll try to use the existing token
              // or let the user re-authenticate
              authTokensStore = storedTokens;
              setAuthTokens(storedTokens);
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

  return useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      if (!authTokens?.idToken || !email) {
        return null;
      }

      apiClient.setAuthToken(authTokens.idToken);
      const user = await apiClient.request<User>(
        API_ENDPOINTS.USER_BY_EMAIL(email)
      );

      return user;
    },
    enabled: !isLoadingTokens && !!authTokens?.idToken && !!email,
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
      if (authTokensStore?.idToken) {
        setIsChecking(false);
        return true;
      }
      
      // If not in memory, try to load from storage
      try {
        const storedTokens = await loadAuthTokens();
        if (storedTokens?.idToken) {
          // Update memory store
          authTokensStore = storedTokens;
          setIsChecking(false);
          return true;
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
