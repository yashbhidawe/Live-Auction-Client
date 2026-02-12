import { useCallback, useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import { getAuctionSocket } from "./auctionSocket";
import type {
  AuctionState,
  BidResult,
  ItemSoldPayload,
  AuctionEndedPayload,
  ChatComment,
  SendCommentPayload,
  CommentRejectedPayload,
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
  const [comments, setComments] = useState<ChatComment[]>([]);
  const [commentError, setCommentError] = useState<string | null>(null);

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
    const onCommentsSnapshot = (snapshot: ChatComment[]) =>
      setComments(Array.isArray(snapshot) ? snapshot : []);
    const onCommentAdded = (comment: ChatComment) => {
      setComments((prev) => [...prev.slice(-79), comment]);
      setCommentError(null);
    };
    const onCommentRejected = (payload: CommentRejectedPayload) =>
      setCommentError(payload?.reason ?? "Message rejected");

    s.on("connect", onConnect);
    s.on("disconnect", onDisconnect);
    s.on("connect_error", onConnectError);
    s.on("auction_state", onAuctionState);
    s.on("bid_result", onBidResult);
    s.on("item_sold", onItemSold);
    s.on("auction_ended", onAuctionEnded);
    s.on("comments_snapshot", onCommentsSnapshot);
    s.on("comment_added", onCommentAdded);
    s.on("comment_rejected", onCommentRejected);

    if (s.connected) setConnected(true);

    return () => {
      s.off("connect", onConnect);
      s.off("disconnect", onDisconnect);
      s.off("connect_error", onConnectError);
      s.off("auction_state", onAuctionState);
      s.off("bid_result", onBidResult);
      s.off("item_sold", onItemSold);
      s.off("auction_ended", onAuctionEnded);
      s.off("comments_snapshot", onCommentsSnapshot);
      s.off("comment_added", onCommentAdded);
      s.off("comment_rejected", onCommentRejected);
    };
  }, []);

  useEffect(() => {
    if (!auctionId) {
      setAuctionState(DEFAULT_STATE);
      setBidResult(null);
      setComments([]);
      setCommentError(null);
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

  const sendComment = useCallback(
    (payload: Omit<SendCommentPayload, "auctionId">) => {
      if (!auctionId) return;
      setCommentError(null);
      socketRef.current?.emit("send_comment", {
        auctionId,
        userId: payload.userId,
        displayName: payload.displayName,
        text: payload.text,
      } satisfies SendCommentPayload);
    },
    [auctionId],
  );

  return {
    auctionState,
    bidResult,
    connected,
    connectionError,
    placeBid,
    comments,
    sendComment,
    commentError,
    lastItemSold,
    lastAuctionEnded,
  };
}
