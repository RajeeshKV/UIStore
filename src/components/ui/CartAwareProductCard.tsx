"use client";

import { useCart } from "@/features/cart/CartContext";
import { ProductCard } from "./ProductCard";
import type { StorefrontProductSummaryResponse } from "@/types/api";

/**
 * ProductCard wired to the cart context.
 * Products that require variant selection (canPurchase=false without a variant)
 * are handled by navigating to the product page via the card link.
 * This component simply forwards addItem to the existing card UI.
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

  function handleAddToCart(p: StorefrontProductSummaryResponse) {
    // Only add directly if backend says canPurchase — no variant needed
    if (p.canPurchase) {
      addItem(p.id, undefined, 1);
    }
    // If canPurchase=false (variant required), the button is disabled in ProductCard
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
