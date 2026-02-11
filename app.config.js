// Used by EAS Build and Expo so the app gets API/socket URLs at build time.
// Set EXPO_PUBLIC_API_URL and EXPO_PUBLIC_SOCKET_URL in EAS secrets or .env when building for production.
export default {
  expo: {
    name: "live-auction",
    slug: "live-auction",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "client",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: { supportsTablet: true },
    android: {
      package: "com.liveauction.app",
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
    },
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png",
      bundler: "metro",
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
          dark: { backgroundColor: "#000000" },
        },
      ],
    ],
    experiments: { typedRoutes: true, reactCompiler: true },
    extra: {
      router: {},
      eas: { projectId: "820a991f-8d67-4362-883e-63702060d8dc" },
      owner: "itsokyash",
      // Injected at build time (EAS or web deploy). Fallback for local prod builds.
      apiUrl: process.env.EXPO_PUBLIC_API_URL ?? "",
      socketUrl: process.env.EXPO_PUBLIC_SOCKET_URL ?? "",
      agoraAppId: process.env.EXPO_PUBLIC_AGORA_APP_ID ?? "",
    },
  },
};
