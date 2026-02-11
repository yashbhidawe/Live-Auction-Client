import { useAuth } from "@clerk/clerk-expo";
import { Pressable, Text, View } from "react-native";
import { env } from "@/constants/env";
import { useAuctionStore } from "@/store/auctionStore";

/**
 * Shows when user is signed in with Clerk but app user sync has failed or is in progress.
 * Displays error + Retry, or loading state.
 */
export function SyncBanner() {
  const { isSignedIn } = useAuth();
  const { user, syncError, syncLoading, retrySync } = useAuctionStore();

  if (!isSignedIn || user) return null;

  if (syncError) {
    return (
      <View className="border-b border-danger/50 bg-danger/10 px-4 py-3">
        <Text className="text-danger text-sm">{syncError}</Text>
        <Text className="text-muted text-xs mt-1" numberOfLines={2}>
          Server: {env.apiUrl} – Run "npm run start:dev" in server/
        </Text>
        <Pressable
          onPress={retrySync}
          className="mt-2 rounded-lg bg-primary self-start px-4 py-2 active:opacity-80"
        >
          <Text className="text-white font-medium">Retry</Text>
        </Pressable>
      </View>
    );
  }

  if (syncLoading) {
    return (
      <View className="border-b border-surface px-4 py-3">
        <Text className="text-muted text-sm">Signing you in…</Text>
      </View>
    );
  }

  return null;
}
