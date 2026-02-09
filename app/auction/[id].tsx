import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AgoraVideo } from "@/components/AgoraVideo";
import type { AgoraRole } from "@/lib/agora";
import { auctionApi } from "@/lib/api";
import { useAgora } from "@/lib/useAgora";
import { useAuctionSocket } from "@/lib/useAuctionSocket";
import { useAuctionStore } from "@/store/auctionStore";

const BID_STEP = 10;

function useItemCountdown(itemEndTimeMs: number | undefined) {
  const [remainingSec, setRemainingSec] = useState<number | null>(null);

  useEffect(() => {
    if (itemEndTimeMs == null) {
      setRemainingSec(null);
      return;
    }
    const tick = () => {
      const rem = Math.max(0, Math.ceil((itemEndTimeMs - Date.now()) / 1000));
      setRemainingSec(rem);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [itemEndTimeMs]);

  return remainingSec;
}

export default function AuctionWatchScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const auctionId = id ?? null;
  const { currentUserId } = useAuctionStore();
  const userId =
    currentUserId ?? `user-${Math.random().toString(36).slice(2, 8)}`;

  const {
    auctionState,
    bidResult,
    connected,
    connectionError,
    placeBid,
    lastAuctionEnded,
  } = useAuctionSocket(auctionId);

  const isSeller = auctionState?.sellerId === userId;
  const videoRole: AgoraRole = isSeller ? "seller" : "buyer";
  const {
    joined,
    remoteUid,
    error: agoraError,
    join,
    leave,
    uid,
    channel,
  } = useAgora(videoRole, auctionId ?? undefined);

  // Buyer: join once when viewing auction, leave only on unmount or auction change. No leave when auctionState updates.
  useEffect(() => {
    if (!auctionId || isSeller) return;
    join();
    return () => leave();
  }, [auctionId, isSeller, join, leave]);

  // Seller: join (and stream) only when status is LIVE; leave when not LIVE.
  useEffect(() => {
    if (!auctionId || !isSeller) return;
    if (auctionState?.status === "LIVE") {
      join();
      return () => leave();
    }
    leave();
    return () => {};
  }, [auctionId, isSeller, auctionState?.status, join, leave]);

  const itemEndTimeMs =
    auctionState && "itemEndTime" in auctionState
      ? (auctionState as { itemEndTime?: number }).itemEndTime
      : undefined;
  const remainingSec = useItemCountdown(itemEndTimeMs);

  const currentItem =
    auctionState?.items?.[auctionState.currentItemIndex ?? 0] ?? null;
  const nextBid = currentItem ? currentItem.highestBid + BID_STEP : 0;
  const canBid = auctionState?.status === "LIVE";

  const [starting, setStarting] = useState(false);
  const [extending, setExtending] = useState(false);

  const handleStart = useCallback(async () => {
    if (!auctionId) return;
    setStarting(true);
    try {
      await auctionApi.startAuction(auctionId);
    } finally {
      setStarting(false);
    }
  }, [auctionId]);

  const handleExtend = useCallback(async () => {
    if (!auctionId || !userId) return;
    setExtending(true);
    try {
      await auctionApi.extendAuction(auctionId, userId);
    } finally {
      setExtending(false);
    }
  }, [auctionId, userId]);

  useEffect(() => {
    if (lastAuctionEnded && lastAuctionEnded.auctionId === auctionId) {
      // Optionally navigate back or show summary
    }
  }, [lastAuctionEnded, auctionId]);

  if (!auctionId) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-muted">Invalid auction</Text>
          <Pressable onPress={() => router.back()} className="mt-4">
            <Text className="text-primary">Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="border-b border-surface px-4 py-2">
        <Pressable onPress={() => router.back()} className="self-start py-2">
          <Text className="text-primary font-medium">← Back</Text>
        </Pressable>
      </View>
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-6 pb-16"
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-4 flex-row items-center gap-2">
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
        {connectionError && (
          <View className="mb-4 rounded-lg border border-danger/50 bg-danger/10 p-3">
            <Text className="text-danger text-sm">{connectionError}</Text>
          </View>
        )}

        {auctionState && (
          <>
            <View className="rounded-xl bg-surface p-4">
              <Text className="text-muted text-xs uppercase tracking-wider">
                Auction
              </Text>
              <Text className="mt-1 font-semibold text-foreground">
                {auctionState.id.slice(0, 8)}… · {auctionState.sellerId}
              </Text>
              <Text className="text-muted mt-1 text-sm">
                {auctionState.status}
              </Text>
            </View>

            {currentItem && (
              <View className="mt-4 rounded-xl bg-surface p-4">
                <Text className="text-muted text-xs uppercase tracking-wider">
                  Current item
                </Text>
                <Text className="mt-1 text-lg font-semibold text-foreground">
                  {currentItem.name}
                </Text>
                <Text className="text-primary mt-1 text-xl font-bold">
                  ${currentItem.highestBid}
                </Text>
                {currentItem.highestBidderId && (
                  <Text className="text-muted mt-1 text-sm">
                    High bidder: {currentItem.highestBidderId}
                  </Text>
                )}
                {remainingSec !== null && auctionState.status === "LIVE" && (
                  <Text className="text-accent mt-2 text-sm font-medium">
                    {remainingSec}s left
                  </Text>
                )}
              </View>
            )}

            {isSeller && auctionState.status === "CREATED" && (
              <Pressable
                onPress={handleStart}
                disabled={starting}
                className="mt-4 rounded-xl bg-accent py-3 active:opacity-80"
              >
                <Text className="text-center font-semibold text-white">
                  {starting ? "Starting…" : "Start auction"}
                </Text>
              </Pressable>
            )}

            {isSeller &&
              auctionState.status === "LIVE" &&
              currentItem?.status === "LIVE" &&
              !currentItem.extended && (
                <Pressable
                  onPress={handleExtend}
                  disabled={extending}
                  className="mt-4 rounded-xl border border-primary py-3 active:opacity-80"
                >
                  <Text className="text-center font-semibold text-primary">
                    {extending ? "Extending…" : "Extend +15s"}
                  </Text>
                </Pressable>
              )}

            {bidResult && (
              <View
                className={`mt-4 rounded-lg border p-3 ${
                  bidResult.accepted
                    ? "border-accent bg-accent/10"
                    : "border-danger bg-danger/10"
                }`}
              >
                <Text
                  className={bidResult.accepted ? "text-accent" : "text-danger"}
                >
                  {bidResult.accepted ? "Bid accepted" : bidResult.reason}
                </Text>
              </View>
            )}

            <View className="mt-6">
              {canBid ? (
                <Pressable
                  onPress={() => placeBid(userId, nextBid)}
                  className="rounded-xl bg-primary py-4 active:opacity-80"
                >
                  <Text className="text-center text-lg font-semibold text-white">
                    Bid ${nextBid}
                  </Text>
                </Pressable>
              ) : (
                <View className="rounded-xl bg-surface py-4">
                  <Text className="text-center text-muted">
                    {auctionState.status === "CREATED"
                      ? "Auction not started"
                      : auctionState.status === "ENDED"
                        ? "Auction ended"
                        : "Cannot bid"}
                  </Text>
                </View>
              )}
            </View>

            <View className="mt-8">
              <Text className="text-muted mb-2 text-xs uppercase tracking-wider">
                {isSeller && auctionState?.status === "LIVE"
                  ? "Your live stream (buyers are watching)"
                  : isSeller
                    ? "Live stream starts when you start the auction"
                    : "Live stream"}
              </Text>
              {agoraError && (
                <View className="mb-2 rounded-lg border border-danger/50 bg-danger/10 p-2">
                  <Text className="text-danger text-xs">{agoraError}</Text>
                </View>
              )}
              <View className="mt-2">
                <AgoraVideo
                  role={videoRole}
                  joined={joined}
                  remoteUid={remoteUid}
                  uid={uid}
                  channelId={channel}
                />
              </View>
            </View>
          </>
        )}

        {!auctionState && connected && (
          <View className="py-8">
            <Text className="text-muted text-center">Loading auction…</Text>
          </View>
        )}

        <Text className="text-muted mt-6 text-center text-xs">
          You: {userId}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
