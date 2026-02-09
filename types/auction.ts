/**
 * Client-side auction types (mirror backend).
 */

export type ItemStatus = "PENDING" | "LIVE" | "SOLD" | "UNSOLD";

export type AuctionStatus = "CREATED" | "LIVE" | "ENDED";

export interface AuctionItem {
  id: string;
  name: string;
  startingPrice: number;
  durationSec: number;
  extraDurationSec: number;
  status: ItemStatus;
  highestBid: number;
  highestBidderId: string | null;
  extended: boolean;
}

export interface AuctionState {
  id: string;
  sellerId: string;
  status: AuctionStatus;
  items: AuctionItem[];
  currentItemIndex: number;
  maxDurationSec: number;
  /** Set by server for client countdown (UTC ms). */
  itemEndTime?: number;
}

export interface AuctionListItem {
  id: string;
  sellerId: string;
  status: string;
}

export interface CreateAuctionItemInput {
  name: string;
  startingPrice: number;
  durationSec?: number;
}

export interface CreateAuctionInput {
  sellerId: string;
  items: CreateAuctionItemInput[];
}
