import { env } from "@/constants/env";
import type {
  AuctionState,
  AuctionListItem,
  CreateAuctionInput,
} from "@/types/auction";

let tokenProvider: (() => Promise<string | null>) | null = null;

export function setTokenProvider(fn: () => Promise<string | null>) {
  tokenProvider = fn;
}

export async function getAuthToken(): Promise<string | null> {
  return tokenProvider ? tokenProvider() : null;
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: object;
};

async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, ...rest } = options;
  const url = `${env.apiUrl}${path}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(rest.headers as Record<string, string>),
  };

  let token: string | null = null;
  try {
    token = tokenProvider ? await tokenProvider() : null;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // Clerk can throw during auth-state transitions; treat as no token.
    if (!msg.toLowerCase().includes("signed out")) {
      throw err instanceof Error ? err : new Error(String(err));
    }
  }
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const config: RequestInit = {
    ...rest,
    headers,
    ...(body !== undefined && { body: JSON.stringify(body) }),
  };

  let response: Response;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    response = await fetch(url, { ...config, signal: controller.signal });
    clearTimeout(timeout);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("abort") || msg.includes("timeout")) {
      throw new Error(`Request timed out. Is the server running at ${url}?`);
    }
    if (
      msg.includes("Network request failed") ||
      msg.includes("Failed to fetch")
    ) {
      throw new Error(
        `Cannot reach server at ${url}. Check network and EXPO_PUBLIC_SOCKET_URL.`,
      );
    }
    throw new Error(err instanceof Error ? err.message : String(err));
  }

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `Request failed: ${response.status}`);
  }

  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return response.json();
  }

  return response.text() as unknown as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, body?: object) =>
    request<T>(path, { method: "POST", body }),
  put: <T>(path: string, body?: object) =>
    request<T>(path, { method: "PUT", body }),
  patch: <T>(path: string, body?: object) =>
    request<T>(path, { method: "PATCH", body }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

export const userApi = {
  register: (displayName: string) =>
    api.post<{ id: string; displayName: string }>("/users", { displayName }),
  sync: (displayName?: string) =>
    api.post<{ id: string; displayName: string }>("/users/sync", {
      displayName,
    }),
  updateMe: (displayName: string) =>
    api.patch<{ id: string; displayName: string }>("/users/me", {
      displayName,
    }),
  getUser: (id: string) =>
    api.get<{ id: string; displayName: string }>(`/users/${id}`),
  healthCheck: () => api.get<{ status: string }>("/health"),
};

export const auctionApi = {
  fetchAuctions: () => api.get<AuctionListItem[]>("/auctions"),

  fetchAuction: (id: string) => api.get<AuctionState>(`/auctions/${id}`),

  createAuction: (body: CreateAuctionInput) =>
    api.post<AuctionState>("/auctions", body),

  startAuction: (id: string) => api.post<AuctionState>(`/auctions/${id}/start`),

  extendAuction: (id: string, sellerId: string) =>
    api.post<AuctionState>(`/auctions/${id}/extend`, { sellerId }),
};
