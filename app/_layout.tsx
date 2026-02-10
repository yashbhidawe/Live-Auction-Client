import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "react-native-reanimated";

import "../global.css";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useAuctionStore } from "@/store/auctionStore";

// Keep splash visible until we're ready
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { user, authLoaded, loadUserFromStorage } = useAuctionStore();

  // Load user from AsyncStorage on mount
  useEffect(() => {
    loadUserFromStorage().finally(() => {
      SplashScreen.hideAsync();
    });
  }, [loadUserFromStorage]);

  // Auth gate: redirect to /register if no user, or away from /register if logged in
  useEffect(() => {
    if (!authLoaded) return;

    const onRegisterScreen = segments[0] === "register";

    if (!user && !onRegisterScreen) {
      router.replace("/register");
    } else if (user && onRegisterScreen) {
      router.replace("/(tabs)");
    }
  }, [user, authLoaded, segments, router]);

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#0B0B12" }}>
        <SafeAreaProvider>
          <Stack
            screenOptions={{
              contentStyle: { backgroundColor: "#0B0B12" },
              headerShown: false,
            }}
          >
            <Stack.Screen name="register" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="auction/[id]" />
            <Stack.Screen
              name="modal"
              options={{
                presentation: "modal",
                title: "Modal",
              }}
            />
          </Stack>
          <StatusBar style="light" />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
