import { env } from "@/constants/env";
import type {
  AuctionState,
  AuctionListItem,
  CreateAuctionInput,
} from "@/types/auction";

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: object;
};

async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, ...rest } = options;
  const url = `${env.apiUrl}${path}`;

  const config: RequestInit = {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(rest.headers as HeadersInit),
    },
    ...(body !== undefined && { body: JSON.stringify(body) }),
  };

  const response = await fetch(url, config);

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
  getUser: (id: string) =>
    api.get<{ id: string; displayName: string }>(`/users/${id}`),
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
