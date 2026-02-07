import { env } from "@/constants/env";

type RequestInitWithBody = RequestInit & {
  body?: object;
};

async function request<T>(
  path: string,
  options: RequestInitWithBody = {},
): Promise<T> {
  const { body, ...init } = options;
  const url = `${env.apiUrl}${path}`;

  const config: RequestInit = {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

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
