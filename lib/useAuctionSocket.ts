import { useCallback, useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import { getAuctionSocket } from "./auctionSocket";
import type {
  AuctionState,
  BidResult,
  ItemSoldPayload,
  AuctionEndedPayload,
} from "./auctionSocket";

const DEFAULT_STATE: AuctionState | null = null;

export function useAuctionSocket(auctionId: string | null) {
  const socketRef = useRef<Socket | null>(null);
  const [auctionState, setAuctionState] = useState<AuctionState | null>(
    DEFAULT_STATE,
  );
  const [bidResult, setBidResult] = useState<BidResult | null>(null);
  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [lastItemSold, setLastItemSold] = useState<ItemSoldPayload | null>(
    null,
  );
  const [lastAuctionEnded, setLastAuctionEnded] =
    useState<AuctionEndedPayload | null>(null);

  useEffect(() => {
    const s = getAuctionSocket();
    socketRef.current = s;

    const onConnect = () => {
      setConnected(true);
      setConnectionError(null);
    };
    const onDisconnect = () => setConnected(false);
    const onConnectError = (err: Error) =>
      setConnectionError(err?.message ?? "Connection failed");
    const onAuctionState = (state: AuctionState | { error?: string }) => {
      if ("error" in state) {
        setAuctionState(null);
        return;
      }
      setAuctionState(state as AuctionState);
    };
    const onBidResult = (result: BidResult) => setBidResult(result);
    const onItemSold = (payload: ItemSoldPayload) => setLastItemSold(payload);
    const onAuctionEnded = (payload: AuctionEndedPayload) =>
      setLastAuctionEnded(payload);

    s.on("connect", onConnect);
    s.on("disconnect", onDisconnect);
    s.on("connect_error", onConnectError);
    s.on("auction_state", onAuctionState);
    s.on("bid_result", onBidResult);
    s.on("item_sold", onItemSold);
    s.on("auction_ended", onAuctionEnded);

    if (s.connected) setConnected(true);

    return () => {
      s.off("connect", onConnect);
      s.off("disconnect", onDisconnect);
      s.off("connect_error", onConnectError);
      s.off("auction_state", onAuctionState);
      s.off("bid_result", onBidResult);
      s.off("item_sold", onItemSold);
      s.off("auction_ended", onAuctionEnded);
    };
  }, []);

  useEffect(() => {
    if (!auctionId) {
      setAuctionState(DEFAULT_STATE);
      setBidResult(null);
      return;
    }
    const s = socketRef.current;
    if (!s) return;
    s.emit("join_auction", { auctionId });
    return () => {
      s.emit("leave_auction", { auctionId });
    };
  }, [auctionId]);

  const placeBid = useCallback(
    (userId: string, amount: number) => {
      if (!auctionId) return;
      setBidResult(null);
      socketRef.current?.emit("place_bid", { auctionId, userId, amount });
    },
    [auctionId],
  );

  return {
    auctionState,
    bidResult,
    connected,
    connectionError,
    placeBid,
    lastItemSold,
    lastAuctionEnded,
  };
}
