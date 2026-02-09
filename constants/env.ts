import Constants from "expo-constants";
import { Platform } from "react-native";

// Android emulator uses 10.0.2.2 to reach host localhost
const getDevApiUrl = () =>
  Platform.OS === "android" ? "http://10.0.2.2:3000" : "http://localhost:3000";

// On native (Expo Go), use Metro bundler host so device can reach your machine. Web uses localhost.
function getDevSocketUrl(): string {
  const override =
    Constants.expoConfig?.extra?.socketUrl ??
    process.env.EXPO_PUBLIC_SOCKET_URL;
  if (override) return override;

  // Expo Go on device: use Metro bundler host (your dev machine) so socket can connect
  const manifest = Constants.expoConfig ?? Constants.manifest;
  const debuggerHost = (manifest as { debuggerHost?: string })?.debuggerHost;
  const hostUri = (manifest as { hostUri?: string })?.hostUri;
  const host = debuggerHost
    ? debuggerHost.split(":")[0]
    : hostUri
      ? hostUri.replace(/^exp:\/\//, "").split(":")[0]
      : null;
  if (host) return `http://${host}:3000`;

  return getDevApiUrl();
}

const ENV = {
  dev: {
    apiUrl: getDevApiUrl(),
    socketUrl: getDevSocketUrl(),
  },
  staging: {
    apiUrl: "https://staging-api.example.com",
    socketUrl: "https://staging-api.example.com",
  },
  prod: {
    apiUrl: "https://api.example.com",
    socketUrl: "https://api.example.com",
  },
};

const getEnvVars = () => {
  const envName = __DEV__ ? "dev" : "prod";
  return ENV[envName];
};

export const env = getEnvVars();

// For values that might come from app.config.js extra (EAS builds)
export const config = Constants.expoConfig?.extra ?? {};
