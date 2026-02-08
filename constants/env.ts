import Constants from "expo-constants";
import { Platform } from "react-native";

// Android emulator uses 10.0.2.2 to reach host localhost
const getDevApiUrl = () =>
  Platform.OS === "android" ? "http://10.0.2.2:3000" : "http://localhost:3000";

// Socket: use LOCAL_IP for physical device (e.g. EXPO_PUBLIC_SOCKET_URL=http://192.168.1.x:3000)
const getDevSocketUrl = () => {
  const override =
    Constants.expoConfig?.extra?.socketUrl ??
    process.env.EXPO_PUBLIC_SOCKET_URL;
  if (override) return override;
  return getDevApiUrl();
};

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
