import { io, Socket } from "socket.io-client";
import { env } from "@/constants/env";
import { getAuthToken } from "@/lib/api";
import type { AuctionState } from "@/types/auction";

export type { AuctionState };

export type BidResult =
  | { accepted: true }
  | { accepted: false; reason: string };

export interface ItemSoldPayload {
  itemId: string;
  winnerId: string | null;
  finalPrice: number;
  /** true when item had bids and was sold; false when passed/unsold */
  sold: boolean;
}

export interface AuctionEndedPayload {
  auctionId: string;
  results: Array<{
    itemId: string;
    winnerId: string | null;
    finalPrice: number;
  }>;
}

export interface ChatComment {
  id: string;
  auctionId: string;
  userId: string;
  displayName: string;
  text: string;
  createdAt: number;
}

export interface SendCommentPayload {
  auctionId: string;
  text: string;
}

export interface CommentRejectedPayload {
  reason: string;
}

let socket: Socket | null = null;

export function getAuctionSocket(): Socket {
  if (!socket) {
    socket = io(env.socketUrl, {
      autoConnect: true,
      auth: async (cb) => {
        const token = await getAuthToken();
        cb(token ? { token } : {});
      },
    });
  }
  return socket;
}
