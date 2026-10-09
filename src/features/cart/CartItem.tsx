"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils";
import { normalizeStock } from "@/types/api";
import type { CartItemResponse } from "@/types/api";

interface CartItemProps {
  item: CartItemResponse;
  currency: string;
  locale: string;
  isMutating: boolean;
  onUpdateQuantity: (itemId: string, qty: number) => void;
  onRemove: (itemId: string) => void;
  compact?: boolean;
}

export function CartItem({ item, currency, locale, isMutating, onUpdateQuantity, onRemove, compact = false }: CartItemProps) {
  const priceStr    = formatPrice(item.unitPrice, item.currency ?? currency, locale);
  const totalStr    = formatPrice(item.lineTotal, item.currency ?? currency, locale);
  const stock       = normalizeStock(item.stockAvailability);
  const isUnavailable = stock === "OutOfStock" || !item.canPurchase;

  return (
    <div
      className={cn(
        "flex gap-3.5",
        compact ? "py-3.5" : "py-5",
        "border-b border-border last:border-none",
        isUnavailable && "opacity-60",
      )}
    >
      {/* Image */}
      <Link
        href={item.productSlug ? `/products/${item.productSlug}` : "#"}
        aria-label={`View ${item.productName}`}
        className={cn(
          "relative shrink-0 overflow-hidden rounded-xl bg-surface-container border border-border",
          compact ? "h-16 w-16" : "h-20 w-20",
        )}
        tabIndex={-1}
      >
        {item.primaryImageUrl ? (
          <Image
            src={item.primaryImageUrl}
            alt={item.productName ?? "Product"}
            fill
            sizes={compact ? "64px" : "80px"}
            className="object-contain p-1.5"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <ShoppingBag className="size-5 text-border" aria-hidden="true" />
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1 min-w-0">
        <Link
          href={item.productSlug ? `/products/${item.productSlug}` : "#"}
          className="text-[13px] font-semibold text-foreground line-clamp-2 hover:text-foreground/70 transition-colors leading-snug"
        >
          {item.productName}
        </Link>

        {/* Variant display: prefer structured attributes, fall back to plain description */}
        {item.variantAttributes && item.variantAttributes.length > 0 ? (
          <p className="text-[12px] text-foreground-muted leading-relaxed">
            {item.variantAttributes.map((a) => `${a.attributeName}: ${a.value}`).join(" · ")}
          </p>
        ) : item.variantDescription ? (
          <p className="text-[12px] text-foreground-muted">{item.variantDescription}</p>
        ) : null}

        {item.sku && (
          <p className="text-[11px] text-foreground-muted">SKU: {item.sku}</p>
        )}

        {isUnavailable && (
          <p className="text-[12px] text-danger font-semibold">
            {stock === "OutOfStock" ? "Out of stock" : "Unavailable"}
          </p>
        )}

        <div className="flex items-center justify-between gap-2 mt-2 flex-wrap">
          {/* Quantity controls */}
          <div
            className="flex items-center rounded-lg border border-border overflow-hidden bg-surface-elevated"
            role="group"
            aria-label={`Quantity for ${item.productName}`}
          >
            <button
              onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
              disabled={isMutating || item.quantity <= 1}
              aria-label="Decrease quantity"
              className="flex h-8 w-8 items-center justify-center text-foreground-muted hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Minus className="size-3" />
            </button>
            <span
              className="min-w-8 text-center text-[13px] font-bold text-foreground px-1 border-x border-border"
              aria-live="polite"
              aria-label={`Quantity: ${item.quantity}`}
            >
              {item.quantity}
            </span>
            <button
              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
              disabled={isMutating}
              aria-label="Increase quantity"
              className="flex h-8 w-8 items-center justify-center text-foreground-muted hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus className="size-3" />
            </button>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-1.5 ml-auto">
            {item.quantity > 1 && (
              <span className="text-[12px] text-foreground-muted">{priceStr} ×</span>
            )}
            <span className="text-[14px] font-extrabold text-foreground tabular-nums">
              {totalStr}
            </span>
          </div>
        </div>
      </div>

      {/* Remove */}
      <button
        onClick={() => onRemove(item.id)}
        disabled={isMutating}
        aria-label={`Remove ${item.productName} from cart`}
        className={cn(
          "shrink-0 self-start mt-0.5",
          "flex h-8 w-8 items-center justify-center rounded-lg",
          "text-foreground-muted hover:text-danger hover:bg-danger/5",
          "transition-colors duration-150",
          "disabled:opacity-40 disabled:cursor-not-allowed",
        )}
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  );
}
