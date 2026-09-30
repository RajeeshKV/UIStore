"use client";

import Link from "next/link";
import { ArrowLeft, ShoppingBag, Tag, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { CartItem } from "./CartItem";
import { useCart } from "./CartContext";

interface CartPageClientProps {
  currency: string;
  locale: string;
}

export function CartPageClient({ currency, locale }: CartPageClientProps) {
  const { cart, isLoading, isMutating, updateItem, removeItem, clearCart } = useCart();

  const items = cart?.items ?? [];
  const subtotal = cart?.subtotal ?? 0;
  const effectiveCurrency = cart?.currency ?? currency;
  // §1.1: couponCode shows applied chip — subtotal is pre-discount
  const appliedCouponCode = cart?.couponCode ?? null;

  if (isLoading) return <CartPageSkeleton />;

  return (
    <div className="container-x mx-auto py-8 md:py-12 min-h-[60vh]">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <h1 className="text-h2 text-foreground">
          Your Cart{items.length > 0 && (
            <span className="text-foreground-muted font-normal text-h3 ml-2">
              ({items.length})
            </span>
          )}
        </h1>
        <Link
          href="/shop"
          className="inline-flex items-center gap-1.5 text-body-sm text-foreground-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Continue Shopping
        </Link>
      </div>

      {/* Empty state */}
      {items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-5 text-center">
          <div className="rounded-full bg-muted p-6">
            <ShoppingBag className="size-10 text-foreground-muted" aria-hidden="true" />
          </div>
          <div>
            <p className="text-h4 font-semibold text-foreground">Your cart is empty</p>
            <p className="text-body-sm text-foreground-muted mt-2 max-w-sm">
              Looks like you haven&apos;t added anything yet. Browse our collection to find
              something you&apos;ll love.
            </p>
          </div>
          <Link href="/shop">
            <Button variant="primary" size="lg">Shop Now</Button>
          </Link>
        </div>
      )}

      {/* Cart content */}
      {items.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 items-start">
          {/* Items — 2/3 width on desktop */}
          <div className="lg:col-span-2">
            {/* Clear cart */}
            <div className="flex justify-end mb-2">
              <button
                onClick={clearCart}
                disabled={isMutating}
                className={cn(
                  "flex items-center gap-1.5 text-caption text-foreground-muted",
                  "hover:text-danger transition-colors disabled:opacity-40",
                )}
              >
                <Trash2 className="size-3" aria-hidden="true" />
                Clear cart
              </button>
            </div>

            {/* Item list */}
            <div>
              {items.map((item) => (
                <CartItem
                  key={item.id}
                  item={item}
                  currency={effectiveCurrency}
                  locale={locale}
                  isMutating={isMutating}
                  onUpdateQuantity={updateItem}
                  onRemove={removeItem}
                />
              ))}
            </div>
          </div>

          {/* Summary — 1/3 width, sticky on desktop */}
          <div className="lg:sticky lg:top-24">
            <div className="rounded-xl border border-border bg-surface-elevated p-6 flex flex-col gap-4">
              <h2 className="text-h4 text-foreground">Order Summary</h2>

              <div className="flex flex-col gap-2 text-body-sm">
                <div className="flex justify-between">
                  <span className="text-foreground-muted">
                    Subtotal ({items.length} item{items.length !== 1 ? "s" : ""})
                  </span>
                  <span className="font-medium text-foreground tabular-nums">
                    {formatPrice(subtotal, effectiveCurrency, locale)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground-muted">Shipping</span>
                  <span className="text-foreground-muted">Calculated at checkout</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground-muted">Tax</span>
                  <span className="text-foreground-muted">Calculated at checkout</span>
                </div>
              </div>

              {/* §1.1: coupon chip — shown when couponCode is present on cart */}
              {appliedCouponCode && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-success/5 border border-success/20 text-body-sm">
                  <Tag className="size-3.5 text-success shrink-0" aria-hidden="true" />
                  <span className="text-foreground font-medium">{appliedCouponCode}</span>
                  <span className="text-foreground-muted">applied — discount shown at checkout</span>
                </div>
              )}

              <div className="flex justify-between py-3 border-t border-border text-body font-semibold">
                <span className="text-foreground">Estimated Total</span>
                <span className="text-foreground tabular-nums">
                  {formatPrice(subtotal, effectiveCurrency, locale)}
                </span>
              </div>

              <p className="text-caption text-foreground-muted">
                Final total including shipping and taxes will be shown at checkout.
              </p>

              {/* Checkout CTA */}
              <Link href="/checkout">
                <Button variant="primary" size="lg" fullWidth>
                  Proceed to Checkout
                </Button>
              </Link>

              <Link href="/shop">
                <Button variant="outline" size="md" fullWidth>
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CartPageSkeleton() {
  return (
    <div className="container-x mx-auto py-8 md:py-12" aria-hidden="true">
      <Skeleton className="h-8 w-36 mb-8" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
        <div className="lg:col-span-2 flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4 py-4 border-b border-border">
              <Skeleton className="h-20 w-20 rounded-lg shrink-0" />
              <div className="flex-1 flex flex-col gap-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-1/2" />
                <div className="flex justify-between mt-2">
                  <Skeleton className="h-7 w-24 rounded-md" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div>
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
