"use client";

import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWishlist } from "./WishlistContext";
import { useAuth } from "@/features/auth/AuthContext";
import { useRouter } from "next/navigation";

interface WishlistButtonProps {
  productId: string;
  variantId?: string;
  className?: string;
  size?: "sm" | "md";
  overlay?: boolean;
}

export function WishlistButton({
  productId,
  variantId,
  className,
  size = "md",
  overlay = false,
}: WishlistButtonProps) {
  const { isAuthenticated } = useAuth();
  const { wishedIds, toggle } = useWishlist();
  const router = useRouter();

  const isWished = wishedIds.has(productId);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      const redirect = encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : "/");
      router.push(`/auth/login?redirect=${redirect}`);
      return;
    }
    await toggle(productId, variantId);
  }

  const iconSize = size === "sm" ? "size-3.5" : "size-5";
  const btnSize = size === "sm" ? "h-7 w-7" : "h-10 w-10";

  return (
    <button
      type="button"
      aria-label={isWished ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={isWished}
      onClick={handleClick}
      className={cn(
        "flex items-center justify-center rounded-full transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
        overlay
          ? "bg-surface-elevated/90 backdrop-blur-sm shadow-sm hover:bg-surface-elevated hover:scale-105"
          : "bg-surface-elevated border border-border hover:border-primary shadow-[0_2px_8px_rgba(0,0,0,0.06)]",
        btnSize,
        className,
      )}
    >
      <Heart
        className={cn(
          iconSize,
          "transition-colors",
          isWished ? "fill-secondary text-secondary" : "text-foreground-muted",
        )}
      />
    </button>
  );
}
