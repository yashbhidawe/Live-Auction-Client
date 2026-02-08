import { useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import { getAuctionSocket } from "./auctionSocket";
import type { AuctionState, BidResult } from "./auctionSocket";

export function useAuctionSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [auctionState, setAuctionState] = useState<AuctionState>({
    status: "CREATED",
    startingPrice: 0,
    highestBid: 0,
    highestBidderId: null,
  });
  const [bidResult, setBidResult] = useState<BidResult | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const s = getAuctionSocket();
    socketRef.current = s;

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onAuctionState = (state: AuctionState) => setAuctionState(state);
    const onBidResult = (result: BidResult) => setBidResult(result);

    s.on("connect", onConnect);
    s.on("disconnect", onDisconnect);
    s.on("auction_state", onAuctionState);
    s.on("bid_result", onBidResult);

    if (s.connected) {
      setConnected(true);
    }

    return () => {
      s.off("connect", onConnect);
      s.off("disconnect", onDisconnect);
      s.off("auction_state", onAuctionState);
      s.off("bid_result", onBidResult);
    };
  }, []);

  const placeBid = (userId: string, amount: number) => {
    setBidResult(null);
    socketRef.current?.emit("place_bid", { userId, amount });
  };

  return { auctionState, bidResult, connected, placeBid };
}
