/**
 * Auth API — matches actual backend schema
 *
 * Customer auth: Google OAuth only → POST /api/v1/auth/google
 * Admin auth:    email/username + password → POST /api/v1/auth/login
 */
import { apiClient, tokenStore } from "./client";
import type {
  TokenResponse,
  LoginRequest,
  GoogleCallbackRequest,
  MeResponse,
} from "@/types/api";

export const authApi = {
  /** Customer: exchange Google ID token for application JWT */
  googleSignIn: (data: GoogleCallbackRequest) =>
    apiClient.post<TokenResponse>("/api/v1/auth/google", data, {
      skipAuth: true,
    }),

  /** Admin: username-or-email + password login */
  adminLogin: (data: LoginRequest) =>
    apiClient.post<TokenResponse>("/api/v1/auth/login", data, {
      skipAuth: true,
    }),

  logout: () => {
    const refreshToken = tokenStore.getRefresh();
    tokenStore.clear();
    return apiClient.post("/api/v1/auth/logout", { refreshToken });
  },

  logoutAll: () => {
    tokenStore.clear();
    return apiClient.post("/api/v1/auth/logout-all", {});
  },

  me: () => apiClient.get<MeResponse>("/api/v1/me"),

  requestPasswordReset: (email: string) =>
    apiClient.post("/api/v1/auth/request-password-reset", { email }, {
      skipAuth: true,
    }),

  resetPassword: (token: string, newPassword: string) =>
    apiClient.post("/api/v1/auth/reset-password", { token, newPassword }, {
      skipAuth: true,
    }),
};
