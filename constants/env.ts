import Constants from "expo-constants";
import { Platform } from "react-native";

// Single base URL for API and Socket in dev. On device, use Metro host (your LAN IP) so both work.
function getDevBaseUrl(): string {
  const override =
    Constants.expoConfig?.extra?.socketUrl ??
    process.env.EXPO_PUBLIC_SOCKET_URL;
  if (override) return override;

  const manifest = Constants.expoConfig ?? Constants.manifest;
  const debuggerHost = (manifest as { debuggerHost?: string })?.debuggerHost;
  const hostUri = (manifest as { hostUri?: string })?.hostUri;
  const host = debuggerHost
    ? debuggerHost.split(":")[0]
    : hostUri
      ? hostUri.replace(/^exp:\/\//, "").split(":")[0]
      : null;
  if (host) return `http://${host}:3000`;

  return Platform.OS === "android"
    ? "http://10.0.2.2:3000"
    : "http://localhost:3000";
}

const ENV = {
  dev: {
    apiUrl: getDevBaseUrl(),
    socketUrl: getDevBaseUrl(),
    agoraAppId: process.env.EXPO_PUBLIC_AGORA_APP_ID ?? "",
  },
  staging: {
    apiUrl: "https://staging-api.example.com",
    socketUrl: "https://staging-api.example.com",
    agoraAppId: process.env.EXPO_PUBLIC_AGORA_APP_ID ?? "",
  },
  prod: {
    apiUrl: "https://api.example.com",
    socketUrl: "https://api.example.com",
    agoraAppId: process.env.EXPO_PUBLIC_AGORA_APP_ID ?? "",
  },
};

const getEnvVars = () => {
  const envName = __DEV__ ? "dev" : "prod";
  return ENV[envName];
};

export const env = getEnvVars();

// For values that might come from app.config.js extra (EAS builds)
export const config = Constants.expoConfig?.extra ?? {};
