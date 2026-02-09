import { auctionApi } from "@/lib/api";
import type { AuctionListItem, AuctionState } from "@/types/auction";
import { create } from "zustand";

interface AuctionStore {
  auctions: AuctionListItem[];
  selectedAuctionId: string | null;
  currentUserId: string | null;
  setAuctions: (auctions: AuctionListItem[]) => void;
  setSelectedAuction: (id: string | null) => void;
  setCurrentUserId: (id: string | null) => void;
  fetchAuctions: () => Promise<void>;
  addAuction: (state: AuctionState) => void;
}

export const useAuctionStore = create<AuctionStore>((set) => ({
  auctions: [],
  selectedAuctionId: null,
  currentUserId: null,

  setAuctions: (auctions) => set({ auctions }),

  setSelectedAuction: (selectedAuctionId) => set({ selectedAuctionId }),

  setCurrentUserId: (currentUserId) => set({ currentUserId }),

  fetchAuctions: async () => {
    const list = await auctionApi.fetchAuctions();
    set({ auctions: list });
  },

  addAuction: (state) =>
    set((prev) => ({
      auctions: [
        ...prev.auctions,
        { id: state.id, sellerId: state.sellerId, status: state.status },
      ],
    })),
}));
