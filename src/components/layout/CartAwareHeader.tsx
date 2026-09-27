"use client";

import { useCart } from "@/features/cart/CartContext";
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

  return (
    <Header
      storeName={storeName}
      logoUrl={logoUrl}
      cartCount={itemCount}
      onCartClick={openDrawer}
    />
  );
}
