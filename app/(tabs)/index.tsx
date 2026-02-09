import { useState } from "react";
import { Text, View, Pressable, ScrollView } from "react-native";
import { AgoraVideo } from "@/components/AgoraVideo";
import type { AgoraRole } from "@/lib/agora";
import { useAgora } from "@/lib/useAgora";
import { useAuctionSocket } from "@/lib/useAuctionSocket";

const BID_STEP = 10;

export default function HomeScreen() {
  const { auctionState, bidResult, connected, connectionError, placeBid } =
    useAuctionSocket();
  const [userId] = useState(
    () => `user-${Math.random().toString(36).slice(2, 8)}`,
  );
  const [videoRole, setVideoRole] = useState<AgoraRole>("buyer");
  const {
    joined,
    remoteUid,
    error: agoraError,
    join,
    leave,
    uid,
  } = useAgora(videoRole);

  const nextBid = auctionState.highestBid + BID_STEP;
  const canBid = auctionState.status === "LIVE";

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="p-6 pb-16"
    >
      <View className="mb-6 flex-row items-center gap-2">
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
          <Text className="text-muted mt-1 text-xs">
            On device? Set EXPO_PUBLIC_SOCKET_URL to your machine IP (e.g.
            http://192.168.1.x:3000) in client/.env
          </Text>
        </View>
      )}

      <View className="rounded-xl bg-surface p-5">
        <Text className="text-muted text-xs uppercase tracking-wider">
          Status
        </Text>
        <Text className="mt-1 text-xl font-bold text-foreground">
          {auctionState.status}
        </Text>

        <Text className="text-muted mt-4 text-xs uppercase tracking-wider">
          Current bid
        </Text>
        <Text className="mt-1 text-2xl font-bold text-primary">
          ${auctionState.highestBid}
        </Text>

        {auctionState.highestBidderId && (
          <>
            <Text className="text-muted mt-4 text-xs uppercase tracking-wider">
              High bidder
            </Text>
            <Text className="mt-1 text-foreground">
              {auctionState.highestBidderId}
            </Text>
          </>
        )}
      </View>

      {bidResult && (
        <View
          className={`mt-4 rounded-lg border p-3 ${
            bidResult.accepted
              ? "border-accent bg-accent/10"
              : "border-danger bg-danger/10"
          }`}
        >
          <Text className={bidResult.accepted ? "text-accent" : "text-danger"}>
            {bidResult.accepted ? "Bid accepted" : bidResult.reason}
          </Text>
        </View>
      )}

      {/* Live video (Agora) — requires dev build, not Expo Go */}
      <View className="mt-8">
        <Text className="text-muted mb-2 text-xs uppercase tracking-wider">
          Live video
        </Text>
        <View className="flex-row gap-2 mb-2">
          <Pressable
            onPress={() => setVideoRole("seller")}
            className={`flex-1 rounded-lg py-2 ${
              videoRole === "seller" ? "bg-primary" : "bg-surface"
            }`}
          >
            <Text
              className={`text-center text-sm font-medium ${
                videoRole === "seller" ? "text-white" : "text-muted"
              }`}
            >
              Seller
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setVideoRole("buyer")}
            className={`flex-1 rounded-lg py-2 ${
              videoRole === "buyer" ? "bg-primary" : "bg-surface"
            }`}
          >
            <Text
              className={`text-center text-sm font-medium ${
                videoRole === "buyer" ? "text-white" : "text-muted"
              }`}
            >
              Buyer
            </Text>
          </Pressable>
        </View>
        {!joined ? (
          <Pressable
            onPress={join}
            className="rounded-xl bg-accent py-3 active:opacity-80"
          >
            <Text className="text-center font-semibold text-white">
              Join video
            </Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={leave}
            className="rounded-xl border border-danger py-3 active:opacity-80"
          >
            <Text className="text-center font-semibold text-danger">
              Leave video
            </Text>
          </Pressable>
        )}
        {agoraError && (
          <View className="mt-2 rounded-lg border border-danger/50 bg-danger/10 p-2">
            <Text className="text-danger text-xs">{agoraError}</Text>
          </View>
        )}
        <View className="mt-3">
          <AgoraVideo
            role={videoRole}
            joined={joined}
            remoteUid={remoteUid}
            uid={uid}
          />
        </View>
      </View>

      <View className="mt-8">
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

      <Text className="text-muted mt-6 text-center text-xs">You: {userId}</Text>
    </ScrollView>
  );
}
