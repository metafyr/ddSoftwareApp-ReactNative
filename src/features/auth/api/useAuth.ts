import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as WebBrowser from "expo-web-browser";
import {
  useAuthRequest,
  exchangeCodeAsync,
  revokeAsync,
  ResponseType,
} from "expo-auth-session";
import { useState, useEffect, useMemo } from "react";
import { apiClient } from "@shared/api/client";
import { API_ENDPOINTS } from "@shared/api/endpoints";
import { User } from "@shared/types";
import { getAuthConfig } from "../config/authConfig";

WebBrowser.maybeCompleteAuthSession();

// Store auth tokens in memory
let authTokensStore: {
  accessToken?: string;
  idToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType?: string;
} | null = null;

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
  const email = authTokens?.idToken
    ? extractEmailFromToken(authTokens.idToken)
    : null;

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
    enabled: !!authTokens?.idToken && !!email,
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

        // Store tokens in memory
        authTokensStore = exchangeTokenResponse;

        // Update state
        setAuthTokens(exchangeTokenResponse);

        // Invalidate queries
        queryClient.invalidateQueries({ queryKey: ["currentUser"] });
        queryClient.invalidateQueries({ queryKey: ["isAuthenticated"] });
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

        // Clear tokens
        authTokensStore = null;
        setAuthTokens(null);
        apiClient.setAuthToken(null);
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
  return useQuery({
    queryKey: ["isAuthenticated"],
    queryFn: async () => {
      return !!authTokensStore?.idToken;
    },
  });
};

// For backward compatibility
export const useSignInWithGoogle = useSignIn;
