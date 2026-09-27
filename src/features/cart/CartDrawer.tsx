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
  const { cart, isLoading, isMutating, drawerOpen, closeDrawer, updateItem, removeItem } =
    useCart();

  const items = cart?.items ?? [];
  const subtotal = cart?.subtotal ?? 0;
  const effectiveCurrency = cart?.currency ?? currency;

  const footer = (
    <div className="flex flex-col gap-3">
      {/* Subtotal */}
      <div className="flex items-center justify-between py-2 border-t border-border">
        <span className="text-body-sm text-foreground-muted">Subtotal</span>
        <span className="text-body font-semibold text-foreground tabular-nums">
          {formatPrice(subtotal, effectiveCurrency, locale)}
        </span>
      </div>
      <p className="text-caption text-foreground-muted">
        Shipping, taxes and discounts calculated at checkout.
      </p>
      <Link href="/cart" onClick={closeDrawer}>
        <Button variant="outline" fullWidth size="lg">
          View Cart
        </Button>
      </Link>
      {/* Checkout */}
      <Link href="/checkout" onClick={closeDrawer}>
        <Button variant="primary" fullWidth size="lg">
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
      <div className="rounded-full bg-muted p-5">
        <ShoppingBag className="size-8 text-foreground-muted" aria-hidden="true" />
      </div>
      <div>
        <p className="text-body font-medium text-foreground">Your cart is empty</p>
        <p className="text-body-sm text-foreground-muted mt-1">
          Add some products to get started.
        </p>
      </div>
      <Link href="/shop" onClick={onClose}>
        <Button variant="outline" size="md">
          Continue Shopping
        </Button>
      </Link>
    </div>
  );
}

function CartDrawerSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex gap-3 py-3 border-b border-border">
          <Skeleton className="h-16 w-16 rounded-lg shrink-0" />
          <div className="flex-1 flex flex-col gap-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-2/3" />
            <div className="flex justify-between mt-1">
              <Skeleton className="h-7 w-20 rounded-md" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
