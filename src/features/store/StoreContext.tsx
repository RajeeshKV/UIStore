"use client";

import { createContext, useContext, useState, useEffect } from "react";
import type { PublicBusinessSettingsResponse } from "@/types/api";
import { storeApi } from "@/services/api/store";

interface StoreContextValue {
  settings: PublicBusinessSettingsResponse | null;
  isLoading: boolean;
  /** True when at least one active brand exists — drives Brands nav item */
  hasBrands: boolean;
}

const StoreContext = createContext<StoreContextValue>({
  settings: null,
  isLoading: true,
  hasBrands: false,
});

export function StoreProvider({
  settings: initialSettings,
  children,
}: {
  settings: PublicBusinessSettingsResponse | null;
  children: React.ReactNode;
}) {
  const [settings, setSettings] = useState<PublicBusinessSettingsResponse | null>(initialSettings);
  const [isLoading, setIsLoading] = useState(false);
  const [hasBrands, setHasBrands] = useState(false);

  useEffect(() => {
    setIsLoading(true);

    // Fetch settings and brands in parallel on every client mount
    Promise.all([
      storeApi.getSettings(),
      storeApi.getBrands(),
    ]).then(([settingsRes, brandsRes]) => {
      if (settingsRes.ok) setSettings(settingsRes.data);
      if (brandsRes.ok) {
        setHasBrands(brandsRes.data.filter((b) => b.name?.trim()).length > 0);
      }
      setIsLoading(false);
    });
  }, []);

  return (
    <StoreContext.Provider value={{ settings, isLoading, hasBrands }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  return useContext(StoreContext);
}
