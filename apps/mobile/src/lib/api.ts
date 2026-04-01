import * as SecureStore from "expo-secure-store";

function resolveApiUrl(): string {
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  const isDevelopment = typeof __DEV__ !== "undefined" ? __DEV__ : process.env.NODE_ENV !== "production";

  if (!configuredUrl) {
    if (isDevelopment) return "http://localhost:3001/api";
    throw new Error("EXPO_PUBLIC_API_URL is required for preview and production builds.");
  }

  const normalizedUrl = configuredUrl.replace(/\/+$/, "");
  const isLocalhost =
    normalizedUrl.includes("localhost") ||
    normalizedUrl.includes("127.0.0.1") ||
    normalizedUrl.includes("0.0.0.0");

  if (!isDevelopment && isLocalhost) {
    throw new Error("EXPO_PUBLIC_API_URL must point to a deployed API in preview and production builds.");
  }

  return normalizedUrl;
}

const API_URL = resolveApiUrl();

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync("accessToken");
}

async function refreshTokens(): Promise<string | null> {
  const refreshToken = await SecureStore.getItemAsync("refreshToken");
  if (!refreshToken) return null;

  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) return null;

  const { data } = await res.json();
  await SecureStore.setItemAsync("accessToken", data.accessToken);
  await SecureStore.setItemAsync("refreshToken", data.refreshToken);
  return data.accessToken;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  let token = await getAccessToken();

  const makeRequest = async (t: string | null) =>
    fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        ...(options.body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(t ? { Authorization: `Bearer ${t}` } : {}),
        ...options.headers,
      },
    });

  let res = await makeRequest(token);

  // Auto-refresh on 401
  if (res.status === 401) {
    token = await refreshTokens();
    if (!token) throw new Error("Session expired");
    res = await makeRequest(token);
  }

  const json = await res.json();
  if (!res.ok) {
    throw new ApiError(
      json.error?.message ?? "Request failed",
      res.status,
      json.error?.code
    );
  }
  return json.data as T;
}

export const api = {
  get: <T>(path: string) => apiRequest<T>(path, { method: "GET" }),
  post: <T>(path: string, body?: unknown) =>
    apiRequest<T>(path, { method: "POST", ...(body !== undefined ? { body: JSON.stringify(body) } : {}) }),
  patch: <T>(path: string, body?: unknown) =>
    apiRequest<T>(path, { method: "PATCH", ...(body !== undefined ? { body: JSON.stringify(body) } : {}) }),
  delete: <T>(path: string, body?: unknown) =>
    apiRequest<T>(path, { method: "DELETE", ...(body !== undefined ? { body: JSON.stringify(body) } : {}) }),
};
