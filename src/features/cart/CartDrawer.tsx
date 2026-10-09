"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { CartItem } from "./CartItem";
import { useCart } from "./CartContext";

interface CartDrawerProps {
  currency: string;
  locale: string;
}

export function CartDrawer({ currency, locale }: CartDrawerProps) {
  const { cart, isLoading, isMutating, drawerOpen, closeDrawer, updateItem, removeItem } = useCart();

  const items             = cart?.items ?? [];
  const subtotal          = cart?.subtotal ?? 0;
  const effectiveCurrency = cart?.currency ?? currency;

  const footer = (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between py-2 border-t border-border">
        <span className="text-[13px] text-foreground-muted">Subtotal</span>
        <span className="text-[16px] font-extrabold text-foreground tabular-nums">
          {formatPrice(subtotal, effectiveCurrency, locale)}
        </span>
      </div>
      <p className="text-[11px] text-foreground-muted leading-relaxed">
        Shipping, taxes and discounts calculated at checkout.
      </p>
      <Link href="/cart" onClick={closeDrawer}>
        <Button variant="secondary" fullWidth size="lg" className="rounded-xl">
          View Cart
        </Button>
      </Link>
      <Link href="/checkout" onClick={closeDrawer}>
        <Button variant="primary" fullWidth size="lg" className="rounded-xl">
          Checkout
        </Button>
      </Link>
    </div>
  );

  return (
    <Drawer
      open={drawerOpen}
      onClose={closeDrawer}
      title={
        items.length > 0
          ? `Your Cart (${items.length} item${items.length !== 1 ? "s" : ""})`
          : "Your Cart"
      }
      side="right"
      width="w-full max-w-sm"
      footer={items.length > 0 ? footer : undefined}
    >
      {isLoading ? (
        <CartDrawerSkeleton />
      ) : items.length === 0 ? (
        <EmptyCartDrawer onClose={closeDrawer} />
      ) : (
        <div className="-mx-1">
          {items.map((item) => (
            <CartItem
              key={item.id}
              item={item}
              currency={effectiveCurrency}
              locale={locale}
              isMutating={isMutating}
              onUpdateQuantity={updateItem}
              onRemove={removeItem}
              compact
            />
          ))}
        </div>
      )}
    </Drawer>
  );
}

function EmptyCartDrawer({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
      <div className="rounded-2xl bg-muted border border-border p-5">
        <ShoppingBag className="size-8 text-foreground-muted" aria-hidden="true" />
      </div>
      <div>
        <p className="text-[14px] font-bold text-foreground">Your cart is empty</p>
        <p className="text-[13px] text-foreground-muted mt-1 leading-relaxed">
          Add some products to get started.
        </p>
      </div>
      <Link href="/shop" onClick={onClose}>
        <Button variant="secondary" size="md" className="rounded-full">
          Continue Shopping
        </Button>
      </Link>
    </div>
  );
}

function CartDrawerSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex gap-3.5 py-3.5 border-b border-border">
          <Skeleton className="h-16 w-16 rounded-xl shrink-0" />
          <div className="flex-1 flex flex-col gap-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-2/3" />
            <div className="flex justify-between mt-1">
              <Skeleton className="h-8 w-24 rounded-lg" />
              <Skeleton className="h-4 w-14" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
