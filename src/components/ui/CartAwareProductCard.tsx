"use client";

import { useRouter } from "next/navigation";
import { useCart } from "@/features/cart/CartContext";
import { useAuth } from "@/features/auth/AuthContext";
import { ProductCard } from "./ProductCard";
import { pendingCartItem } from "@/lib/pendingCartItem";
import type { StorefrontProductSummaryResponse } from "@/types/api";

/**
 * ProductCard wired to CartContext + auth.
 *
 * If the user is not authenticated and clicks "Add to Cart":
 *  1. Saves the item to sessionStorage (pendingCartItem).
 *  2. Redirects to /auth/login?redirect=<current path>.
 *  After login, CartContext replays the pending item automatically.
 */
export function CartAwareProductCard({
  product,
  currency,
  locale,
  eager,
}: {
  product: StorefrontProductSummaryResponse;
  currency?: string;
  locale?: string;
  eager?: boolean;
}) {
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  function handleAddToCart(p: StorefrontProductSummaryResponse) {
    if (!isAuthenticated) {
      // Save pending item and send user to login
      pendingCartItem.save({ productId: p.id, variantId: undefined, quantity: 1 });
      const redirect = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/";
      router.push(`/auth/login?redirect=${encodeURIComponent(redirect)}`);
      return;
    }

    if (p.canPurchase) {
      addItem(p.id, undefined, 1);
    }
  }

  return (
    <ProductCard
      product={product}
      currency={currency}
      locale={locale}
      onAddToCart={handleAddToCart}
      eager={eager}
    />
  );
}
