"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/features/cart/CartContext";
import { storeApi } from "@/services/api/store";
import { Header } from "./Header";

interface CartAwareHeaderProps {
  storeName?: string;
  logoUrl?: string | null;
}

/**
 * Thin client wrapper that reads live cart count from CartContext
 * and passes the cart drawer opener to the Header.
 * Keeps Header itself unopinionated about cart state.
 */
export function CartAwareHeader({ storeName, logoUrl }: CartAwareHeaderProps) {
  const { itemCount, openDrawer } = useCart();
  const [hasBrands, setHasBrands] = useState<boolean | null>(null);

  // Fetch brands once on mount — public endpoint, no auth needed.
  // null = still loading (don't hide yet); false = no brands; true = has brands.
  useEffect(() => {
    storeApi.getBrands().then((result) => {
      setHasBrands(result.ok ? result.data.length > 0 : false);
    });
  }, []);

  return (
    <Header
      storeName={storeName}
      logoUrl={logoUrl}
      cartCount={itemCount}
      onCartClick={openDrawer}
      hasBrands={hasBrands ?? true} // default true while loading to avoid nav flicker
    />
  );
}
