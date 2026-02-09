import { io, Socket } from "socket.io-client";
import { env } from "@/constants/env";
import type { AuctionState } from "@/types/auction";

export type { AuctionState };

export type BidResult =
  | { accepted: true }
  | { accepted: false; reason: string };

export interface ItemSoldPayload {
  itemId: string;
  winnerId: string | null;
  finalPrice: number;
}

export interface AuctionEndedPayload {
  auctionId: string;
  results: Array<{
    itemId: string;
    winnerId: string | null;
    finalPrice: number;
  }>;
}

let socket: Socket | null = null;

export function getAuctionSocket(): Socket {
  if (!socket) {
    socket = io(env.socketUrl, { autoConnect: true });
  }
  return socket;
}
