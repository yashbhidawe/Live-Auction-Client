import { auctionApi } from "@/lib/api";
import { loadUser, saveUser, clearUser, type StoredUser } from "@/lib/auth";
import type { AuctionListItem, AuctionState } from "@/types/auction";
import { create } from "zustand";

interface AuctionStore {
  /* ── user identity ── */
  user: StoredUser | null;
  authLoaded: boolean;
  setUser: (user: StoredUser) => void;
  loadUserFromStorage: () => Promise<void>;
  logout: () => Promise<void>;

  /* ── auctions ── */
  auctions: AuctionListItem[];
  selectedAuctionId: string | null;
  setAuctions: (auctions: AuctionListItem[]) => void;
  setSelectedAuction: (id: string | null) => void;
  fetchAuctions: () => Promise<void>;
  addAuction: (state: AuctionState) => void;
}

export const useAuctionStore = create<AuctionStore>((set) => ({
  /* ── user identity ── */
  user: null,
  authLoaded: false,

  setUser: (user) => {
    saveUser(user).catch(() => {});
    set({ user });
  },

  loadUserFromStorage: async () => {
    const user = await loadUser();
    set({ user, authLoaded: true });
  },

  logout: async () => {
    await clearUser();
    set({ user: null });
  },

  /* ── auctions ── */
  auctions: [],
  selectedAuctionId: null,

  setAuctions: (auctions) => set({ auctions }),

  setSelectedAuction: (selectedAuctionId) => set({ selectedAuctionId }),

  fetchAuctions: async () => {
    const list = await auctionApi.fetchAuctions();
    set((prev) => {
      const fromApi = new Set(list.map((a) => a.id));
      const extra = prev.auctions.filter((a) => !fromApi.has(a.id));
      return { auctions: [...list, ...extra] };
    });
  },

  addAuction: (state) =>
    set((prev) => ({
      auctions: [
        ...prev.auctions,
        { id: state.id, sellerId: state.sellerId, status: state.status },
      ],
    })),
}));
