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

  const items             = cart?.items ?? [];
  const subtotal          = cart?.subtotal ?? 0;
  const effectiveCurrency = cart?.currency ?? currency;
  const appliedCouponCode = cart?.couponCode ?? null;

  if (isLoading) return <CartPageSkeleton />;

  return (
    <div className="px-5 md:px-8 lg:px-10 py-8 md:py-12 min-h-[60vh]">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <h1 className="text-[28px] md:text-[36px] font-extrabold text-[#191c1e] tracking-tight">
          Your Cart
          {items.length > 0 && (
            <span className="text-[#444748] font-normal text-[20px] ml-2">({items.length})</span>
          )}
        </h1>
        <Link
          href="/shop"
          className="inline-flex items-center gap-1.5 text-[13px] text-[#444748] hover:text-[#191c1e] transition-colors"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Continue Shopping
        </Link>
      </div>

      {/* Empty state */}
      {items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-5 text-center">
          <div className="rounded-2xl bg-[#f3f4f6] p-6 border border-[#e1e2e4]">
            <ShoppingBag className="size-10 text-[#5A6578]" aria-hidden="true" />
          </div>
          <div>
            <p className="text-[18px] font-bold text-[#191c1e]">Your cart is empty</p>
            <p className="text-[13px] text-[#444748] mt-2 max-w-sm leading-relaxed">
              Looks like you haven&apos;t added anything yet. Browse our collection to find
              something you&apos;ll love.
            </p>
          </div>
          <Link href="/shop">
            <Button variant="primary" size="lg" className="rounded-full px-8">Shop Now</Button>
          </Link>
        </div>
      )}

      {/* Cart content */}
      {items.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 items-start">
          {/* Items */}
          <div className="lg:col-span-2">
            <div className="flex justify-end mb-3">
              <button
                onClick={clearCart}
                disabled={isMutating}
                className="flex items-center gap-1.5 text-[12px] text-[#5A6578] hover:text-danger transition-colors disabled:opacity-40"
              >
                <Trash2 className="size-3" aria-hidden="true" />
                Clear cart
              </button>
            </div>
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

          {/* Summary — sticky sidebar */}
          <div className="lg:sticky lg:top-24">
            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 flex flex-col gap-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
              <h2 className="text-[16px] font-bold text-[#191c1e] tracking-tight">Order Summary</h2>

              <div className="flex flex-col gap-2.5 text-[13px]">
                <div className="flex justify-between">
                  <span className="text-[#444748]">Subtotal ({items.length} item{items.length !== 1 ? "s" : ""})</span>
                  <span className="font-semibold text-[#191c1e] tabular-nums">{formatPrice(subtotal, effectiveCurrency, locale)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#444748]">Shipping</span>
                  <span className="text-[#444748]">At checkout</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#444748]">Tax</span>
                  <span className="text-[#444748]">At checkout</span>
                </div>
              </div>

              {appliedCouponCode && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-success/5 border border-success/20 text-[13px]">
                  <Tag className="size-3.5 text-success shrink-0" aria-hidden="true" />
                  <span className="text-[#191c1e] font-semibold">{appliedCouponCode}</span>
                  <span className="text-[#444748]">applied</span>
                </div>
              )}

              <div className="flex justify-between py-3 border-t border-[#e1e2e4]">
                <span className="text-[14px] font-bold text-[#191c1e]">Estimated Total</span>
                <span className="text-[16px] font-extrabold text-[#0D0D0D] tabular-nums">
                  {formatPrice(subtotal, effectiveCurrency, locale)}
                </span>
              </div>

              <p className="text-[11px] text-[#5A6578] leading-relaxed">
                Final total including shipping and taxes will be shown at checkout.
              </p>

              <Link href="/checkout">
                <Button variant="primary" size="lg" fullWidth className="rounded-xl h-12 text-[14px]">
                  Proceed to Checkout
                </Button>
              </Link>

              <Link href="/shop">
                <Button variant="secondary" size="md" fullWidth className="rounded-xl">
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
    <div className="px-5 md:px-8 lg:px-10 py-8 md:py-12" aria-hidden="true">
      <Skeleton className="h-9 w-36 mb-8" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
        <div className="lg:col-span-2 flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4 py-5 border-b border-[#e1e2e4]">
              <Skeleton className="h-20 w-20 rounded-xl shrink-0" />
              <div className="flex-1 flex flex-col gap-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-1/2" />
                <div className="flex justify-between mt-2">
                  <Skeleton className="h-8 w-24 rounded-lg" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div>
          <Skeleton className="h-72 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
