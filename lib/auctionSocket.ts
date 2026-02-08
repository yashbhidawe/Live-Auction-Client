import { io, Socket } from "socket.io-client";
import { env } from "@/constants/env";

export type AuctionStatus = "CREATED" | "LIVE" | "ENDED";

export interface AuctionState {
  status: AuctionStatus;
  startingPrice: number;
  highestBid: number;
  highestBidderId: string | null;
}

export type BidResult =
  | { accepted: true }
  | { accepted: false; reason: string };

let socket: Socket | null = null;

export function getAuctionSocket(): Socket {
  if (!socket) {
    socket = io(env.socketUrl, { autoConnect: true });
  }
  return socket;
}
