/**
 * Kromic Store – Centralized API Client
 *
 * All network requests go through this client.
 * Handles: base URL, JSON serialization, authorization headers,
 * silent token refresh, normalized error responses.
 *
 * Feature API modules (auth.ts, products.ts, etc.) import `apiClient` from here.
 * Components never call fetch() directly.
 */

import { env } from "@/config/env";

// ── Error types ───────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly errors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class NetworkError extends Error {
  constructor(message = "Network request failed. Check your connection.") {
    super(message);
    this.name = "NetworkError";
  }
}

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiError | NetworkError };

// ── Token storage helpers ─────────────────────────────────────────────────────

const TOKEN_KEY = "kromic_access_token";
const REFRESH_KEY = "kromic_refresh_token";

export const tokenStore = {
  getAccess: (): string | null =>
    typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null,
  getRefresh: (): string | null =>
    typeof window !== "undefined" ? localStorage.getItem(REFRESH_KEY) : null,
  set: (access: string, refresh: string) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(TOKEN_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear: () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

// ── Internal refresh state (prevent concurrent refresh races) ─────────────────

let refreshPromise: Promise<boolean> | null = null;

async function attemptRefresh(): Promise<boolean> {
  const refreshToken = tokenStore.getRefresh();
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${env.apiUrl}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) {
      tokenStore.clear();
      return false;
    }
    const data = await res.json();
    tokenStore.set(data.accessToken, data.refreshToken ?? refreshToken);
    return true;
  } catch {
    tokenStore.clear();
    return false;
  }
}

// ── Core request function ─────────────────────────────────────────────────────

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  /** Skip attaching Authorization header */
  skipAuth?: boolean;
  /** Skip automatic token refresh attempt on 401 */
  skipRefresh?: boolean;
}

async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<ApiResult<T>> {
  const { body, skipAuth, skipRefresh, ...init } = options;

  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  const headers: Record<string, string> = {
    // Don't set Content-Type for FormData — browser sets it with correct boundary
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(init.headers as Record<string, string>),
  };

  if (!skipAuth) {
    const token = tokenStore.getAccess();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const url = path.startsWith("http") ? path : `${env.apiUrl}${path}`;

  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers,
      body: body !== undefined ? (isFormData ? (body as FormData) : JSON.stringify(body)) : undefined,
    });
  } catch {
    return { ok: false, error: new NetworkError() };
  }

  // Handle 401 with token refresh
  if (res.status === 401 && !skipRefresh && !skipAuth) {
    if (!refreshPromise) {
      refreshPromise = attemptRefresh().finally(() => {
        refreshPromise = null;
      });
    }
    const refreshed = await refreshPromise;
    if (refreshed) {
      // Retry original request with new token
      return request<T>(path, { ...options, skipRefresh: true });
    }
    // Refresh failed — dispatch event so app can react (e.g. redirect to login)
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("kromic:session-expired"));
    }
  }

  // 204 No Content
  if (res.status === 204) {
    return { ok: true, data: undefined as T };
  }

  let payload: unknown;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (!res.ok) {
    // Handle both ASP.NET ProblemDetails shape AND the custom { success, error: { code, message } } shape
    const p = payload as {
      // ASP.NET ProblemDetails
      title?: string;
      detail?: string;
      errors?: Record<string, string[]>;
      // Custom Kromic error shape
      success?: boolean;
      error?: { code?: string; message?: string };
    } | null;

    const message =
      p?.error?.message       // custom shape: { success: false, error: { message } }
      ?? p?.detail            // ASP.NET ProblemDetails: detail
      ?? p?.title             // ASP.NET ProblemDetails: title
      ?? normalizeStatusMessage(res.status);

    const code = p?.error?.code ?? String(res.status);

    return {
      ok: false,
      error: new ApiError(
        res.status,
        code,
        message,
        p?.errors,
      ),
    };
  }

  return { ok: true, data: payload as T };
}

function normalizeStatusMessage(status: number): string {
  switch (status) {
    case 400: return "Invalid request. Please check your input.";
    case 401: return "Please sign in to continue.";
    case 403: return "You don't have permission to perform this action.";
    case 404: return "The requested resource was not found.";
    case 409: return "This action cannot be completed due to a conflict.";
    case 422: return "Validation failed. Please review your input.";
    case 429: return "Too many requests. Please slow down.";
    case 500: return "Something went wrong on our end. Please try again or contact support.";
    default:  return "Something went wrong. Please try again or contact support.";
  }
}

// ── Public API client ─────────────────────────────────────────────────────────

export const apiClient = {
  get: <T>(path: string, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...options, method: "GET" }),

  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "method">) =>
    request<T>(path, { ...options, method: "POST", body }),

  put: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "method">) =>
    request<T>(path, { ...options, method: "PUT", body }),

  patch: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "method">) =>
    request<T>(path, { ...options, method: "PATCH", body }),

  delete: <T>(path: string, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...options, method: "DELETE" }),

  /**
   * Multipart/form-data POST — used for file uploads (e.g. product images).
   * Passes FormData directly; does NOT set Content-Type (browser sets it with boundary).
   */
  postForm: <T>(path: string, formData: FormData, options?: Omit<RequestOptions, "method" | "body">) => {
    const { headers: extraHeaders, ...rest } = options ?? {};
    const headers: Record<string, string> = { ...(extraHeaders as Record<string, string>) };
    delete headers["Content-Type"];
    return request<T>(path, { ...rest, method: "POST", headers, body: formData as unknown });
  },

  /**
   * Multipart/form-data PUT — used for image replacement (category image, brand logo).
   */
  putForm: <T>(path: string, formData: FormData, options?: Omit<RequestOptions, "method" | "body">) => {
    const { headers: extraHeaders, ...rest } = options ?? {};
    const headers: Record<string, string> = { ...(extraHeaders as Record<string, string>) };
    delete headers["Content-Type"];
    return request<T>(path, { ...rest, method: "PUT", headers, body: formData as unknown });
  },
};
