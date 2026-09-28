"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { authApi } from "@/services/api/auth";
import { tokenStore } from "@/services/api/client";
import type { MeResponse } from "@/types/api";

// ── Types ─────────────────────────────────────────────────────────────────────

interface AuthContextValue {
  user: MeResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** Sign in with a Google ID token → exchanges for app JWT */
  signInWithGoogle: (idToken: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  /** Re-fetch /me and refresh user state */
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── Load current user on mount ─────────────────────────────────────────────
  const refresh = useCallback(async () => {
    const token = tokenStore.getAccess();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    const result = await authApi.me();
    if (result.ok) {
      setUser(result.data);
    } else {
      setUser(null);
      if (result.error && "status" in result.error && result.error.status === 401) {
        tokenStore.clear();
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void refresh();

    // When session expires, clear user — the page's own guard handles redirect
    const handler = () => {
      setUser(null);
      setIsLoading(false);
      // Redirect to login — only if currently on a protected page
      if (typeof window !== "undefined" &&
          window.location.pathname.startsWith("/account")) {
        const redirect = encodeURIComponent(window.location.pathname);
        window.location.replace(`/auth/login?redirect=${redirect}`);
      }
    };
    window.addEventListener("kromic:session-expired", handler);
    return () => window.removeEventListener("kromic:session-expired", handler);
  }, [refresh]);

  // ── Google Sign In ─────────────────────────────────────────────────────────
  const signInWithGoogle = useCallback(
    async (idToken: string): Promise<{ ok: boolean; error?: string }> => {
      const result = await authApi.googleSignIn({ idToken });
      if (result.ok) {
        tokenStore.set(result.data.accessToken, result.data.refreshToken ?? "");
        const meResult = await authApi.me();
        if (meResult.ok) setUser(meResult.data);
        return { ok: true };
      }
      const msg =
        result.error && "message" in result.error
          ? result.error.message
          : "Sign-in failed. Please try again.";
      return { ok: false, error: msg };
    },
    [],
  );

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        signInWithGoogle,
        logout,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
