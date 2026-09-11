// HTTP client for the loyalty API.
//
// Everything the app sends goes through request(), so the bearer token, the
// base URL and error shaping are decided in exactly one place. The token is
// held in memory for speed and mirrored into secure storage so a session
// survives a restart; AUTH_TOKEN_KEY is the single shared key — the sign-in
// flow writes it and this module reads it, both with secure*.

import { storage } from "@/src/utils/storage";

export const AUTH_TOKEN_KEY = "surrey.auth.token";

const RAW_BASE = process.env.EXPO_PUBLIC_BACKEND_URL ?? "";
export const API_BASE = RAW_BASE.replace(/\/+$/, "");

// With no backend configured the app falls back to its bundled sample data, so
// the prototype still demonstrates every screen offline.
export const hasBackend = API_BASE.length > 0;

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

let token: string | null = null;
let loaded = false;

export async function loadToken(): Promise<string | null> {
  if (!loaded) {
    token = await storage.secureGet<string | null>(AUTH_TOKEN_KEY, null);
    loaded = true;
  }
  return token;
}

export async function setToken(next: string | null): Promise<void> {
  token = next;
  loaded = true;
  if (next) await storage.secureSet(AUTH_TOKEN_KEY, next);
  else await storage.secureRemove(AUTH_TOKEN_KEY);
}

export function currentToken(): string | null {
  return token;
}

type Options = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  auth?: boolean;
  timeoutMs?: number;
  // Extra headers, for the desk endpoints which authenticate with the
  // practice's own key rather than a patient's bearer token.
  headers?: Record<string, string>;
};

export async function request<T>(path: string, options: Options = {}): Promise<T> {
  const { method = "GET", body, auth = true, timeoutMs = 15000, headers: extra } = options;

  if (!hasBackend) {
    throw new ApiError(0, "No backend is configured");
  }

  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";

  if (auth) {
    const bearer = await loadToken();
    if (bearer) headers.Authorization = `Bearer ${bearer}`;
  }
  if (extra) Object.assign(headers, extra);

  // React Native has no fetch timeout, so a dead network would otherwise hang
  // a screen's spinner indefinitely.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (e) {
    clearTimeout(timer);
    const aborted = e instanceof Error && e.name === "AbortError";
    throw new ApiError(
      0,
      aborted ? "That took too long. Please try again." : "No connection. Please check your signal.",
    );
  }
  clearTimeout(timer);

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  let payload: any = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    // A dead session should not leave a stale token behind to fail again.
    // Only ever the patient's own session: a 401 from a desk endpoint means the
    // practice key is wrong, which must not sign the patient out of the app.
    if (response.status === 401 && auth) await setToken(null);
    throw new ApiError(response.status, readDetail(payload) ?? fallbackMessage(response.status));
  }

  return payload as T;
}

// FastAPI puts the message in `detail`, which is a string for HTTPException and
// a list of field errors for a validation failure.
function readDetail(payload: any): string | null {
  if (!payload) return null;
  const detail = payload.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length) {
    const first = detail[0];
    if (typeof first?.msg === "string") return first.msg;
  }
  return null;
}

function fallbackMessage(status: number): string {
  if (status === 401) return "Please sign in again.";
  if (status === 404) return "We could not find that.";
  if (status === 409) return "That has already been done.";
  if (status === 429) return "Too many attempts. Please wait a moment.";
  if (status >= 500) return "Something went wrong at our end. Please try again.";
  return "Something went wrong. Please try again.";
}
