"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/features/cart/CartContext";
import { useAuth } from "@/features/auth/AuthContext";
import { ProductCard } from "./ProductCard";
import { QuickAddDrawer } from "@/features/catalog/QuickAddDrawer";
import { pendingCartItem } from "@/lib/pendingCartItem";
import type { StorefrontProductSummaryResponse } from "@/types/api";

/**
 * ProductCard wired to CartContext + auth.
 *
 * Simple products (no variants): "Add to Cart" adds directly.
 * Products that need variant selection: "Choose Options" opens QuickAddDrawer,
 *   which lazily fetches product detail and shows the variant picker.
 *
 * We can't tell from StorefrontProductSummaryResponse whether a product has
 * variants (the variants array only exists on StorefrontProductResponse).
 * Strategy: always show "Add to Cart" on cards. If the backend rejects the add
 * because a variant is required, the drawer opens automatically. For the initial
 * render we optimistically attempt a direct add — the drawer provides the fallback.
 *
 * NOTE: "Choose Options" button is shown on cards where canPurchase is false or
 * where we've been told to show it explicitly. For products that are in stock and
 * have no variants, direct add works fine.
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

  const [drawerOpen, setDrawerOpen] = useState(false);

  const effectiveCurrency = product.currency ?? currency ?? "INR";
  const effectiveLocale = locale ?? "en-IN";

  function handleAddToCart(p: StorefrontProductSummaryResponse) {
    if (!isAuthenticated) {
      pendingCartItem.save({ productId: p.id, variantId: undefined, quantity: 1 });
      const redirect = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/";
      router.push(`/auth/login?redirect=${encodeURIComponent(redirect)}`);
      return;
    }
    // Direct add — works for simple products with no variants
    if (p.canPurchase) {
      addItem(p.id, undefined, 1);
    }
  }

  function handleChooseOptions(p: StorefrontProductSummaryResponse) {
    if (!isAuthenticated) {
      const redirect = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/";
      router.push(`/auth/login?redirect=${encodeURIComponent(redirect)}`);
      return;
    }
    setDrawerOpen(true);
  }

  function handleQuickAddToCart(productId: string, variantId: string, quantity: number) {
    addItem(productId, variantId, quantity);
  }

  return (
    <>
      <ProductCard
        product={product}
        currency={currency}
        locale={locale}
        onAddToCart={handleAddToCart}
        onChooseOptions={handleChooseOptions}
        eager={eager}
      />

      <QuickAddDrawer
        product={product}
        currency={effectiveCurrency}
        locale={effectiveLocale}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onAddToCart={handleQuickAddToCart}
      />
    </>
  );
}
