"use client";

import { createContext, useContext, useState, useEffect } from "react";
import type { PublicBusinessSettingsResponse } from "@/types/api";
import { storeApi } from "@/services/api/store";

interface StoreContextValue {
  settings: PublicBusinessSettingsResponse | null;
  isLoading: boolean;
}

const StoreContext = createContext<StoreContextValue>({ settings: null, isLoading: true });

/**
 * StoreProvider — seeds with SSR value but ALWAYS re-fetches client-side on mount.
 *
 * Why: Pages are statically pre-rendered at Vercel build time. The SSR settings
 * call runs once during build (when backend may be unreachable) and the result
 * gets baked into HTML. Admin changes to store settings (contact info, social
 * links, Google OAuth client ID etc.) would never appear until the next redeploy.
 *
 * Solution: Use the SSR value as an instant initial render (no flash), then
 * immediately re-fetch live settings from the backend on every page load.
 * This ensures contact details, Google OAuth config, footer icons etc. are
 * always up-to-date without requiring a redeploy.
 */
export function StoreProvider({
  settings: initialSettings,
  children,
}: {
  settings: PublicBusinessSettingsResponse | null;
  children: React.ReactNode;
}) {
  const [settings, setSettings] = useState<PublicBusinessSettingsResponse | null>(initialSettings);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Always re-fetch live settings on client mount
    setIsLoading(true);
    storeApi.getSettings().then((res) => {
      if (res.ok) setSettings(res.data);
      setIsLoading(false);
    });
  }, []);

  return (
    <StoreContext.Provider value={{ settings, isLoading }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  return useContext(StoreContext);
}
