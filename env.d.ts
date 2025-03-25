declare namespace NodeJS {
  interface ProcessEnv {
    // AWS Cognito Configuration
    COGNITO_REGION: string;
    COGNITO_USER_POOL_ID: string;
    COGNITO_USER_POOL_CLIENT_ID: string;
    COGNITO_DOMAIN: string;
    COGNITO_REDIRECT_SIGN_IN: string;
    COGNITO_REDIRECT_SIGN_OUT: string;

    // API Configuration
    API_URL: string;

    // Node environment
    NODE_ENV: "development" | "production" | "test";
  }
}

// For react-native-dotenv
declare module "@env" {
  export const API_URL: string;
  export const COGNITO_REGION: string;
  export const COGNITO_USER_POOL_ID: string;
  export const COGNITO_USER_POOL_CLIENT_ID: string;
  export const COGNITO_DOMAIN: string;
  export const COGNITO_REDIRECT_SIGN_IN: string;
  export const COGNITO_REDIRECT_SIGN_OUT: string;
}
