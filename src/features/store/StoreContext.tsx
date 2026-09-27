"use client";

import { createContext, useContext } from "react";
import type { PublicBusinessSettingsResponse } from "@/types/api";

interface StoreContextValue {
  settings: PublicBusinessSettingsResponse | null;
}

const StoreContext = createContext<StoreContextValue>({ settings: null });

export function StoreProvider({
  settings,
  children,
}: {
  settings: PublicBusinessSettingsResponse | null;
  children: React.ReactNode;
}) {
  return (
    <StoreContext.Provider value={{ settings }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  return useContext(StoreContext);
}
