"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/services/api/auth";
import { tokenStore } from "@/services/api/client";
import type { MeResponse } from "@/types/api";

// ── Types ─────────────────────────────────────────────────────────────────────

interface AdminAuthContextValue {
  admin: MeResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    emailOrUsername: string,
    password: string,
  ) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function useAdminAuth(): AdminAuthContextValue {
  const ctx = useContext(AdminAuthContext);
  if (!ctx)
    throw new Error("useAdminAuth must be used within <AdminAuthProvider>");
  return ctx;
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function AdminAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [admin, setAdmin] = useState<MeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── Load current admin on mount ────────────────────────────────────────────
  const refresh = useCallback(async () => {
    const token = tokenStore.getAccess();
    if (!token) {
      setAdmin(null);
      setIsLoading(false);
      return;
    }
    const result = await authApi.me();
    if (result.ok) {
      // Only accept admin-role users in the admin app
      if (result.data.role?.toLowerCase() === "admin") {
        setAdmin(result.data);
      } else {
        // Customer token — clear and redirect
        tokenStore.clear();
        setAdmin(null);
      }
    } else {
      setAdmin(null);
      if (
        result.error &&
        "status" in result.error &&
        result.error.status === 401
      ) {
        tokenStore.clear();
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void refresh();

    const handler = () => {
      setAdmin(null);
      setIsLoading(false);
      router.replace("/admin/login");
    };
    window.addEventListener("kromic:session-expired", handler);
    return () =>
      window.removeEventListener("kromic:session-expired", handler);
  }, [refresh, router]);

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = useCallback(
    async (
      emailOrUsername: string,
      password: string,
    ): Promise<{ ok: boolean; error?: string }> => {
      // LoginRequest.email accepts either email or username per API contract
      const result = await authApi.adminLogin({
        email: emailOrUsername.trim(),
        password,
      });
      if (result.ok) {
        tokenStore.set(
          result.data.accessToken,
          result.data.refreshToken ?? "",
        );
        const meResult = await authApi.me();
        if (meResult.ok) {
          if (meResult.data.role?.toLowerCase() === "admin") {
            setAdmin(meResult.data);
            return { ok: true };
          } else {
            tokenStore.clear();
            return {
              ok: false,
              error:
                "You do not have permission to access the admin panel.",
            };
          }
        }
        return { ok: true };
      }
      const msg =
        result.error && "message" in result.error
          ? result.error.message
          : "Invalid credentials. Please try again.";
      return { ok: false, error: msg };
    },
    [],
  );

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    await authApi.logout();
    setAdmin(null);
    router.replace("/admin/login");
  }, [router]);

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        isAuthenticated: !!admin,
        isLoading,
        login,
        logout,
        refresh,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}
