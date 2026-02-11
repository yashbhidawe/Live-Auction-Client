import { auctionApi } from "@/lib/api";
import { loadUser, saveUser, clearUser, type StoredUser } from "@/lib/auth";
import type { AuctionListItem, AuctionState } from "@/types/auction";
import { create } from "zustand";

interface AuctionStore {
  /* ── user identity ── */
  user: StoredUser | null;
  authLoaded: boolean;
  syncError: string | null;
  syncLoading: boolean;
  _retrySyncTrigger: number;
  setUser: (user: StoredUser) => void;
  setSyncError: (err: string | null) => void;
  setSyncLoading: (loading: boolean) => void;
  retrySync: () => void;
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
  syncError: null,
  syncLoading: false,
  _retrySyncTrigger: 0,

  setUser: (user) => {
    saveUser(user).catch(() => {});
    set({ user, syncError: null });
  },

  setSyncError: (syncError) => set({ syncError }),
  setSyncLoading: (syncLoading) => set({ syncLoading }),
  retrySync: () =>
    set((s) => ({
      _retrySyncTrigger: s._retrySyncTrigger + 1,
      syncError: null,
    })),

  loadUserFromStorage: async () => {
    const user = await loadUser();
    set({ user, authLoaded: true });
  },

  logout: async () => {
    await clearUser();
    set({ user: null, syncError: null });
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
