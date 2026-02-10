import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { useAuctionSocket } from "@/lib/useAuctionSocket";
import { useAuctionStore } from "@/store/auctionStore";
import type { AuctionListItem } from "@/types/auction";

export default function HomeScreen() {
  const router = useRouter();
  const { auctions, fetchAuctions, setSelectedAuction, user } =
    useAuctionStore();
  const { connected, connectionError } = useAuctionSocket(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      await fetchAuctions();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchAuctions]);

  useEffect(() => {
    load();
  }, [load]);

  // Refetch when user switches to Home tab so new auctions appear without manual refresh
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  const onPressAuction = useCallback(
    (item: AuctionListItem) => {
      setSelectedAuction(item.id);
      router.push(`/auction/${item.id}` as const);
    },
    [router, setSelectedAuction],
  );

  const renderItem = useCallback(
    ({ item }: { item: AuctionListItem }) => (
      <Pressable
        onPress={() => onPressAuction(item)}
        className="mb-3 rounded-xl bg-surface p-4 active:opacity-90"
      >
        <Text className="text-muted text-xs uppercase tracking-wider">
          {item.id.slice(0, 8)}…
        </Text>
        <Text className="mt-1 font-semibold text-foreground">
          {item.sellerName ?? item.sellerId.slice(0, 8)}
        </Text>
        <View className="mt-2 flex-row items-center">
          <View
            className={`mr-2 h-2 w-2 rounded-full ${
              item.status === "LIVE"
                ? "bg-accent"
                : item.status === "ENDED"
                  ? "bg-muted"
                  : "bg-primary"
            }`}
          />
          <Text className="text-muted text-sm">{item.status}</Text>
        </View>
      </Pressable>
    ),
    [onPressAuction],
  );

  const keyExtractor = useCallback((item: AuctionListItem) => item.id, []);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#7C5CFF" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <View className="border-b border-surface px-6 py-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <View
              className={`h-2 w-2 rounded-full ${connected ? "bg-accent" : "bg-muted"}`}
            />
            <Text className="text-muted text-sm">
              {connected
                ? "Connected"
                : connectionError
                  ? "Disconnected"
                  : "Connecting…"}
            </Text>
          </View>
          {user && (
            <Text className="text-foreground text-sm font-medium">
              Hi, {user.displayName}
            </Text>
          )}
        </View>
        {connectionError && (
          <Text className="text-danger mt-1 text-xs">
            On device? Set EXPO_PUBLIC_SOCKET_URL in client/.env
          </Text>
        )}
      </View>

      <FlatList
        data={auctions}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
        ListEmptyComponent={
          <View className="py-12">
            <Text className="text-muted text-center">
              No auctions yet. Use the Create tab to start one.
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#7C5CFF"
          />
        }
      />
    </View>
  );
}
