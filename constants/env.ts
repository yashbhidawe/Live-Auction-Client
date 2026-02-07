import Constants from "expo-constants";
import { Platform } from "react-native";

// Android emulator uses 10.0.2.2 to reach host localhost
const getDevApiUrl = () =>
  Platform.OS === "android" ? "http://10.0.2.2:3000" : "http://localhost:3000";

const ENV = {
  dev: {
    apiUrl: getDevApiUrl(),
  },
  staging: {
    apiUrl: "https://staging-api.example.com",
  },
  prod: {
    apiUrl: "https://api.example.com",
  },
};

const getEnvVars = () => {
  const envName = __DEV__ ? "dev" : "prod";
  return ENV[envName];
};

export const env = getEnvVars();

// For values that might come from app.config.js extra (EAS builds)
export const config = Constants.expoConfig?.extra ?? {};
