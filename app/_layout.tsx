import { Redirect, Stack, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  initialWindowMetrics,
  SafeAreaProvider,
} from "react-native-safe-area-context";
import "react-native-reanimated";

import "../global.css";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ClerkProvider, useAuth, useUser } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { env } from "@/constants/env";
import { setTokenProvider, userApi } from "@/lib/api";
import { useAuctionStore } from "@/store/auctionStore";

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: "(tabs)",
};

function AuthSync() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const { setUser, logout, setSyncError, setSyncLoading, _retrySyncTrigger } =
    useAuctionStore();

  useEffect(() => {
    if (!isLoaded) return;
    console.log("[AuthSync] Token provider set (isLoaded=true)");
    setTokenProvider(getToken);
  }, [isLoaded, getToken]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      if (!isSignedIn) {
        console.log("[AuthSync] Not signed in, clearing user");
        logout().catch(() => {});
        setTokenProvider(async () => null);
      }
      setSyncError(null);
      setSyncLoading(false);
      return;
    }
    let cancelled = false;
    setSyncError(null);
    setSyncLoading(true);
    console.log("[AuthSync] Signed in, starting sync…");

    // Log token presence before making the request
    getToken()
      .then((t) =>
        console.log(
          `[AuthSync] Token: ${t ? `${t.slice(0, 20)}…(${t.length} chars)` : "NULL"}`,
        ),
      )
      .catch(() => console.warn("[AuthSync] Failed to read token"));

    const metadataDisplayName = (
      user?.unsafeMetadata?.displayName as string | undefined
    )
      ?.trim()
      .slice(0, 64);
    const fallbackDisplayName =
      [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
      user?.username?.trim() ||
      user?.primaryEmailAddress?.emailAddress?.split("@")[0]?.trim();
    const preferredDisplayName = metadataDisplayName || fallbackDisplayName;

    userApi
      .sync(preferredDisplayName)
      .then((user) => {
        if (!cancelled) {
          console.log(
            `[AuthSync] Sync OK: id=${user.id}, name=${user.displayName}`,
          );
          setUser({ id: user.id, displayName: user.displayName });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : String(err);
          const lowered = msg.toLowerCase();
          const isExpectedTransitionError =
            lowered.includes("aborted") ||
            lowered.includes("signed out") ||
            lowered.includes("cancelled");

          if (isExpectedTransitionError) {
            console.warn(`[AuthSync] Sync skipped: ${msg}`);
            return;
          }

          const safeMsg = msg || "Failed to sync. Check server & network.";
          console.error(`[AuthSync] Sync FAILED: ${safeMsg}`);
          setSyncError(safeMsg);
        }
      })
      .finally(() => {
        if (!cancelled) setSyncLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [
    isLoaded,
    isSignedIn,
    _retrySyncTrigger,
    user,
    setUser,
    logout,
    setSyncError,
    setSyncLoading,
  ]);

  return null;
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isLoaded, isSignedIn } = useAuth();

  const onRegisterScreen =
    pathname === "/register" || pathname?.startsWith("/register");

  if (!isLoaded) return null;

  if (!isSignedIn && !onRegisterScreen) {
    return <Redirect href="/register" />;
  }
  if (isSignedIn && onRegisterScreen) {
    return <Redirect href="/(tabs)" />;
  }

  return <>{children}</>;
}

export default function RootLayout() {
  const publishableKey = env.clerkPublishableKey;

  if (!publishableKey) {
    console.warn(
      "EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY is not set. Add it to .env or app.config.js extra.",
    );
  }

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <ErrorBoundary>
        <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#0B0B12" }}>
          <SafeAreaProvider initialMetrics={initialWindowMetrics}>
            <AuthSync />
            <LayoutContent />
          </SafeAreaProvider>
        </GestureHandlerRootView>
      </ErrorBoundary>
    </ClerkProvider>
  );
}

function LayoutContent() {
  const { isLoaded } = useAuth();

  useEffect(() => {
    if (isLoaded) SplashScreen.hideAsync();
  }, [isLoaded]);

  if (!isLoaded) return null;

  return (
    <AuthGate>
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
    </AuthGate>
  );
}
