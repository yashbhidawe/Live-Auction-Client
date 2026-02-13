import { useClerk } from "@clerk/clerk-expo";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
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

type StatusFilter = "ALL" | "LIVE" | "CREATED" | "ENDED";

const FILTERS: StatusFilter[] = ["ALL", "LIVE", "CREATED", "ENDED"];

export default function HomeScreen() {
  const router = useRouter();
  const { signOut } = useClerk();
  const { auctions, fetchAuctions, setSelectedAuction, user } =
    useAuctionStore();
  const { connected, connectionError } = useAuctionSocket(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>("ALL");

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

  const counts = useMemo(() => {
    return auctions.reduce(
      (acc, auction) => {
        if (auction.status === "LIVE") acc.live += 1;
        if (auction.status === "CREATED") acc.created += 1;
        if (auction.status === "ENDED") acc.ended += 1;
        return acc;
      },
      { live: 0, created: 0, ended: 0 },
    );
  }, [auctions]);

  const filteredAuctions = useMemo(() => {
    if (filter === "ALL") return auctions;
    return auctions.filter((auction) => auction.status === filter);
  }, [auctions, filter]);

  const renderItem = useCallback(
    ({ item }: { item: AuctionListItem }) => {
      const itemCount = item.itemCount ?? 0;
      const cardHeading = item.firstItemName
        ? itemCount > 1
          ? `${item.firstItemName} +${itemCount - 1} more`
          : item.firstItemName
        : "Auction items";
      const isLive = item.status === "LIVE";
      return (
        <Pressable
          onPress={() => onPressAuction(item)}
          className="mb-3 rounded-2xl border border-surface bg-surface p-4 active:opacity-90"
        >
          <View className="flex-row items-start justify-between">
            <View>
              <Text className="text-muted text-xs uppercase tracking-wider">
                Auction {item.id.slice(0, 8)}
              </Text>
              <Text className="mt-1 text-base font-semibold text-foreground">
                {cardHeading}
              </Text>
            </View>
            <View
              className={`rounded-full px-3 py-1 ${
                isLive
                  ? "bg-accent/20"
                  : item.status === "CREATED"
                    ? "bg-primary/20"
                    : "bg-muted/20"
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  isLive
                    ? "text-accent"
                    : item.status === "CREATED"
                      ? "text-primary"
                      : "text-muted"
                }`}
              >
                {item.status}
              </Text>
            </View>
          </View>

          <View className="mt-3 flex-row items-center justify-between">
            <Text className="text-muted text-sm">
              {isLive ? "Tap to join live stream" : "Tap to view auction"}
            </Text>
            <Text className="text-primary text-sm font-semibold">Open</Text>
          </View>
        </Pressable>
      );
    },
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
      <View className="border-b border-surface px-6 py-4">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-muted text-xs">Welcome back</Text>
            <Text className="text-foreground mt-1 text-xl font-bold">
              {user ? user.displayName : "Live Auctions"}
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={() => router.push("../profile")}
              className="rounded-xl bg-surface px-3 py-2 active:opacity-80"
            >
              <Text className="text-muted text-xs font-semibold">
                Edit profile
              </Text>
            </Pressable>
            <Pressable
              onPress={() => signOut()}
              className="rounded-xl bg-surface px-3 py-2 active:opacity-80"
            >
              <Text className="text-muted text-xs font-semibold">Sign out</Text>
            </Pressable>
          </View>
        </View>

        <View className="mt-4 flex-row items-center gap-2">
          <View
            className={`h-2 w-2 rounded-full ${connected ? "bg-accent" : "bg-muted"}`}
          />
          <Text className="text-muted text-sm">
            {connected ? "Connected" : "Reconnecting..."}
          </Text>
        </View>

        {connectionError && (
          <Text className="text-danger mt-1 text-xs">
            On device? Set EXPO_PUBLIC_SOCKET_URL in client/.env
          </Text>
        )}

        <View className="mt-4 flex-row gap-2">
          <View className="flex-1 rounded-xl bg-surface p-3">
            <Text className="text-muted text-xs">LIVE</Text>
            <Text className="text-foreground mt-1 text-lg font-bold">
              {counts.live}
            </Text>
          </View>
          <View className="flex-1 rounded-xl bg-surface p-3">
            <Text className="text-muted text-xs">CREATED</Text>
            <Text className="text-foreground mt-1 text-lg font-bold">
              {counts.created}
            </Text>
          </View>
          <View className="flex-1 rounded-xl bg-surface p-3">
            <Text className="text-muted text-xs">ENDED</Text>
            <Text className="text-foreground mt-1 text-lg font-bold">
              {counts.ended}
            </Text>
          </View>
        </View>
      </View>

      <FlatList
        data={filteredAuctions}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={{ padding: 20, paddingBottom: 140 }}
        ListHeaderComponent={
          <View className="mb-4 flex-row gap-2">
            {FILTERS.map((value) => {
              const active = value === filter;
              return (
                <Pressable
                  key={value}
                  onPress={() => setFilter(value)}
                  className={`rounded-full px-4 py-2 ${
                    active ? "bg-primary" : "bg-surface"
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      active ? "text-white" : "text-muted"
                    }`}
                  >
                    {value}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        }
        ListEmptyComponent={
          <View className="rounded-2xl border border-surface bg-surface p-6">
            <Text className="text-foreground text-center text-base font-semibold">
              No auctions in {filter}
            </Text>
            <Text className="text-muted mt-2 text-center text-sm">
              Pull to refresh or create a new auction from the Create tab.
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
