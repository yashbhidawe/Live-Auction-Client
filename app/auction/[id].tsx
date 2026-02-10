import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AgoraVideo } from "@/components/AgoraVideo";
import type { AgoraRole } from "@/lib/agora";
import { auctionApi } from "@/lib/api";
import { useAgora } from "@/lib/useAgora";
import { useAuctionSocket } from "@/lib/useAuctionSocket";
import { useAuctionStore } from "@/store/auctionStore";

const BID_STEP = 10;
const { height: SCREEN_H } = Dimensions.get("window");

/* ───── countdown hook ───── */
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

/* ═══════════════════════════════════════════════════════════════════════════ */

export default function AuctionWatchScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const auctionId = id ?? null;
  const { user } = useAuctionStore();
  const userId = user?.id ?? "";

  /* ── socket ── */
  const {
    auctionState,
    bidResult,
    connected,
    connectionError,
    placeBid,
    lastItemSold,
    lastAuctionEnded,
  } = useAuctionSocket(auctionId);

  /* ── video ── */
  const isSeller = auctionState?.sellerId === userId;
  const videoRole: AgoraRole = isSeller ? "seller" : "buyer";
  const {
    joined,
    remoteUid,
    error: agoraError,
    join,
    leave,
    switchCamera,
    uid,
    channel,
  } = useAgora(videoRole, auctionId ?? undefined);

  useEffect(() => {
    if (!auctionId || isSeller) return;
    join();
    return () => leave();
  }, [auctionId, isSeller, join, leave]);

  useEffect(() => {
    if (!auctionId || !isSeller) return;
    if (auctionState?.status === "LIVE") {
      join();
      return () => leave();
    }
    leave();
    return () => {};
  }, [auctionId, isSeller, auctionState?.status, join, leave]);

  /* ── derived state ── */
  const itemEndTimeMs =
    auctionState && "itemEndTime" in auctionState
      ? (auctionState as { itemEndTime?: number }).itemEndTime
      : undefined;
  const remainingSec = useItemCountdown(itemEndTimeMs);

  const currentItem =
    auctionState?.items?.[auctionState.currentItemIndex ?? 0] ?? null;
  const nextBid = currentItem ? currentItem.highestBid + BID_STEP : 0;
  const canBid = auctionState?.status === "LIVE";
  const isLive = auctionState?.status === "LIVE";

  /* ── winner announcement ── */
  const [winnerAnnouncement, setWinnerAnnouncement] = useState<{
    itemName: string;
    winnerId: string | null;
    finalPrice: number;
  } | null>(null);
  const announcementOpacity = useRef(new Animated.Value(0)).current;
  const announcementTranslateY = useRef(new Animated.Value(-40)).current;
  const announcementTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!lastItemSold) return;
    // Look up the item name from auctionState
    const item = auctionState?.items?.find(
      (it) => it.name && it.status === "SOLD",
    );
    const itemName = item?.name ?? `Item`;
    setWinnerAnnouncement({
      itemName,
      winnerId: lastItemSold.winnerId,
      finalPrice: lastItemSold.finalPrice,
    });
    // Animate in
    announcementOpacity.setValue(0);
    announcementTranslateY.setValue(-40);
    Animated.parallel([
      Animated.timing(announcementOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(announcementTranslateY, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();
    // Auto-dismiss after 5 seconds
    if (announcementTimer.current) clearTimeout(announcementTimer.current);
    announcementTimer.current = setTimeout(() => {
      Animated.timing(announcementOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => setWinnerAnnouncement(null));
    }, 5000);
    return () => {
      if (announcementTimer.current) clearTimeout(announcementTimer.current);
    };
  }, [lastItemSold]);

  /* ── actions ── */
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
      // Could navigate back or show summary
    }
  }, [lastAuctionEnded, auctionId]);

  /* ── invalid auction ── */
  if (!auctionId) {
    return (
      <View style={[s.root, { paddingTop: insets.top }]}>
        <StatusBar
          barStyle="light-content"
          translucent
          backgroundColor="transparent"
        />
        <View style={s.center}>
          <Text style={s.mutedText}>Invalid auction</Text>
          <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
            <Text style={s.linkText}>Go back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  /* ════════════════════  MAIN RENDER  ════════════════════ */
  return (
    <View style={s.root}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      {/* ── LAYER 1: Full-screen video background ── */}
      <AgoraVideo
        role={videoRole}
        joined={joined}
        remoteUid={remoteUid}
        uid={uid}
        channelId={channel}
      />

      {/* ── LAYER 2: Floating winner announcement ── */}
      {winnerAnnouncement && (
        <Animated.View
          style={[
            s.winnerOverlay,
            {
              opacity: announcementOpacity,
              transform: [{ translateY: announcementTranslateY }],
              top: insets.top + 60,
            },
          ]}
          pointerEvents="none"
        >
          <View style={s.winnerCard}>
            <Text style={s.winnerEmoji}>🏆</Text>
            <Text style={s.winnerTitle}>SOLD!</Text>
            <Text style={s.winnerItem}>{winnerAnnouncement.itemName}</Text>
            <Text style={s.winnerPrice}>${winnerAnnouncement.finalPrice}</Text>
            {winnerAnnouncement.winnerId ? (
              <Text style={s.winnerName}>
                Won by {winnerAnnouncement.winnerId}
              </Text>
            ) : (
              <Text style={s.winnerNoBids}>No bids</Text>
            )}
          </View>
        </Animated.View>
      )}

      {/* ── LAYER 3: Top bar (back + live badge + connection) ── */}
      <View style={[s.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={s.backBtn}>
          <Text style={s.backText}>←</Text>
        </Pressable>

        <View style={s.topCenter}>
          {isLive && (
            <View style={s.liveBadge}>
              <View style={s.liveDot} />
              <Text style={s.liveText}>LIVE</Text>
            </View>
          )}
          {!isLive && auctionState && (
            <View style={s.statusBadge}>
              <Text style={s.statusText}>{auctionState.status}</Text>
            </View>
          )}
        </View>

        <View style={s.topRight}>
          {isSeller && joined && (
            <Pressable onPress={switchCamera} hitSlop={12} style={s.flipBtn}>
              <Text style={s.flipText}>⟳</Text>
            </Pressable>
          )}
          <View
            style={[
              s.dot,
              { backgroundColor: connected ? "#22E58B" : "#A1A1B3" },
            ]}
          />
        </View>
      </View>

      {/* ── LAYER 4: Bottom overlay (item info + bid + seller controls) ── */}
      <View style={[s.bottomOverlay, { paddingBottom: insets.bottom + 16 }]}>
        {/* Agora error */}
        {agoraError && (
          <View style={s.errorBanner}>
            <Text style={s.errorText}>{agoraError}</Text>
          </View>
        )}

        {/* Connection error */}
        {connectionError && (
          <View style={s.errorBanner}>
            <Text style={s.errorText}>{connectionError}</Text>
          </View>
        )}

        {/* Loading state */}
        {!auctionState && connected && (
          <Text style={s.mutedText}>Loading auction…</Text>
        )}

        {auctionState && (
          <>
            {/* Current item info */}
            {currentItem && (
              <View style={s.itemCard}>
                <View style={s.itemHeader}>
                  <Text style={s.itemName}>{currentItem.name}</Text>
                  {remainingSec !== null && isLive && (
                    <View style={s.timerBadge}>
                      <Text style={s.timerText}>{remainingSec}s</Text>
                    </View>
                  )}
                </View>
                <View style={s.priceRow}>
                  <Text style={s.priceLabel}>Current bid</Text>
                  <Text style={s.priceValue}>${currentItem.highestBid}</Text>
                </View>
                {currentItem.highestBidderId && (
                  <Text style={s.bidderText}>
                    by {currentItem.highestBidderId}
                  </Text>
                )}
              </View>
            )}

            {/* Bid result toast */}
            {bidResult && (
              <View
                style={[
                  s.toast,
                  {
                    backgroundColor: bidResult.accepted
                      ? "rgba(34,229,139,0.2)"
                      : "rgba(255,77,77,0.2)",
                    borderColor: bidResult.accepted ? "#22E58B" : "#FF4D4D",
                  },
                ]}
              >
                <Text
                  style={{
                    color: bidResult.accepted ? "#22E58B" : "#FF4D4D",
                    fontWeight: "600",
                    fontSize: 14,
                  }}
                >
                  {bidResult.accepted ? "Bid accepted!" : bidResult.reason}
                </Text>
              </View>
            )}

            {/* Seller: Start auction */}
            {isSeller && auctionState.status === "CREATED" && (
              <Pressable
                onPress={handleStart}
                disabled={starting}
                style={s.startBtn}
              >
                <Text style={s.startBtnText}>
                  {starting ? "Starting…" : "Start auction"}
                </Text>
              </Pressable>
            )}

            {/* Seller: Extend */}
            {isSeller &&
              isLive &&
              currentItem?.status === "LIVE" &&
              !currentItem.extended && (
                <Pressable
                  onPress={handleExtend}
                  disabled={extending}
                  style={s.extendBtn}
                >
                  <Text style={s.extendBtnText}>
                    {extending ? "Extending…" : "+15s"}
                  </Text>
                </Pressable>
              )}

            {/* Bid button */}
            {canBid && !isSeller && (
              <Pressable
                onPress={() => placeBid(userId, nextBid)}
                style={s.bidBtn}
              >
                <Text style={s.bidBtnText}>Bid ${nextBid}</Text>
              </Pressable>
            )}

            {/* Auction not started / ended */}
            {!canBid && !isSeller && (
              <View style={s.statusMsg}>
                <Text style={s.mutedText}>
                  {auctionState.status === "CREATED"
                    ? "Waiting for seller to start…"
                    : auctionState.status === "ENDED"
                      ? "Auction ended"
                      : "Cannot bid right now"}
                </Text>
              </View>
            )}
          </>
        )}

        {/* Seller label */}
        {auctionState && (
          <Text style={s.sellerLabel}>
            @
            {isSeller
              ? (user?.displayName ?? "You")
              : auctionState.sellerId.slice(0, 8)}
          </Text>
        )}
      </View>
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  STYLES                                                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0B0B12",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  /* ── top bar ── */
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 8,
    zIndex: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  backText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
  },
  topCenter: {
    flex: 1,
    alignItems: "center",
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,50,50,0.85)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#fff",
  },
  liveText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1,
  },
  statusBadge: {
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
  },
  statusText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  topRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  flipBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  flipText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  /* ── bottom overlay ── */
  bottomOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    zIndex: 10,
  },

  /* ── item card ── */
  itemCard: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    backdropFilter: "blur(12px)",
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemName: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    flex: 1,
  },
  timerBadge: {
    backgroundColor: "rgba(255,77,77,0.8)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  timerText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 8,
    gap: 8,
  },
  priceLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
  },
  priceValue: {
    color: "#22E58B",
    fontSize: 28,
    fontWeight: "800",
  },
  bidderText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    marginTop: 4,
  },

  /* ── toast ── */
  toast: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 12,
    alignItems: "center",
  },

  /* ── error ── */
  errorBanner: {
    backgroundColor: "rgba(255,77,77,0.15)",
    borderColor: "rgba(255,77,77,0.4)",
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  errorText: {
    color: "#FF4D4D",
    fontSize: 12,
  },

  /* ── buttons ── */
  bidBtn: {
    backgroundColor: "#7C5CFF",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  bidBtnText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },
  startBtn: {
    backgroundColor: "#22E58B",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  startBtnText: {
    color: "#0B0B12",
    fontSize: 16,
    fontWeight: "800",
  },
  extendBtn: {
    borderWidth: 1.5,
    borderColor: "rgba(124,92,255,0.7)",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
    marginBottom: 12,
  },
  extendBtnText: {
    color: "#7C5CFF",
    fontSize: 14,
    fontWeight: "700",
  },
  statusMsg: {
    alignItems: "center",
    paddingVertical: 12,
    marginBottom: 8,
  },

  /* ── winner announcement ── */
  winnerOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 20,
  },
  winnerCard: {
    backgroundColor: "rgba(0,0,0,0.75)",
    borderRadius: 20,
    paddingHorizontal: 28,
    paddingVertical: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.4)",
    minWidth: 220,
  },
  winnerEmoji: {
    fontSize: 36,
    marginBottom: 4,
  },
  winnerTitle: {
    color: "#FFD700",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 2,
  },
  winnerItem: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 6,
  },
  winnerPrice: {
    color: "#22E58B",
    fontSize: 26,
    fontWeight: "800",
    marginTop: 4,
  },
  winnerName: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 6,
  },
  winnerNoBids: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 14,
    fontStyle: "italic",
    marginTop: 6,
  },

  /* ── misc ── */
  sellerLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 4,
  },
  mutedText: {
    color: "#A1A1B3",
    fontSize: 14,
    textAlign: "center",
  },
  linkText: {
    color: "#7C5CFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
