"use client";

/**
 * WishlistContext — global wishlist state for authenticated customers.
 *
 * - wishedIds: Set of productIds currently in the wishlist (for fast heart rendering).
 * - toggle: adds or removes a product from the wishlist.
 * - Status is loaded lazily when the user is authenticated.
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { wishlistApi } from "@/services/api/wishlist";
import { useAuth } from "@/features/auth/AuthContext";

interface WishlistContextValue {
  /** Set of productIds currently in the wishlist */
  wishedIds: Set<string>;
  /** true while loading initial status */
  loading: boolean;
  /**
   * Toggle a product in/out of the wishlist.
   * Returns true on success.
   */
  toggle: (productId: string, variantId?: string) => Promise<boolean>;
  /** Reload wishlist status from the server */
  refresh: (productIds: string[]) => Promise<void>;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be inside <WishlistProvider>");
  return ctx;
}

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [wishedIds, setWishedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  // Track in-flight mutations to prevent double-taps
  const pending = useRef<Set<string>>(new Set());

  // Refresh status for a given list of product IDs
  const refresh = useCallback(async (productIds: string[]) => {
    if (!isAuthenticated || productIds.length === 0) return;
    const res = await wishlistApi.getStatus(productIds);
    if (res.ok) {
      setWishedIds((prev) => {
        const next = new Set(prev);
        // Clear out the queried IDs first, then re-add the ones that are wishlisted
        productIds.forEach((id) => next.delete(id));
        res.data.productIds.forEach((id) => next.add(id));
        return next;
      });
    }
  }, [isAuthenticated]);

  // On auth change clear state; we load lazily via refresh() from pages
  useEffect(() => {
    if (!isAuthenticated) {
      setWishedIds(new Set());
      setLoading(false);
    }
  }, [isAuthenticated]);

  // When user first becomes authenticated, load the first page of wishlist IDs
  const hasLoadedRef = useRef(false);
  useEffect(() => {
    if (authLoading || !isAuthenticated || hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    setLoading(true);
    wishlistApi.list(1, 100).then((res) => {
      if (res.ok) {
        setWishedIds(new Set(res.data.items.map((i) => i.productId)));
      }
      setLoading(false);
    });
  }, [authLoading, isAuthenticated]);

  // Reset flag when user logs out
  useEffect(() => {
    if (!isAuthenticated) hasLoadedRef.current = false;
  }, [isAuthenticated]);

  const toggle = useCallback(
    async (productId: string, variantId?: string): Promise<boolean> => {
      if (!isAuthenticated) return false;
      if (pending.current.has(productId)) return false;
      pending.current.add(productId);

      const isWished = wishedIds.has(productId);

      // Optimistic update
      setWishedIds((prev) => {
        const next = new Set(prev);
        if (isWished) next.delete(productId);
        else next.add(productId);
        return next;
      });

      try {
        if (isWished) {
          const res = await wishlistApi.remove(productId, variantId);
          if (!res.ok) {
            // Rollback
            setWishedIds((prev) => {
              const next = new Set(prev);
              next.add(productId);
              return next;
            });
            return false;
          }
        } else {
          const res = await wishlistApi.add({ productId, productVariantId: variantId ?? null });
          if (!res.ok) {
            // Rollback
            setWishedIds((prev) => {
              const next = new Set(prev);
              next.delete(productId);
              return next;
            });
            return false;
          }
        }
        return true;
      } finally {
        pending.current.delete(productId);
      }
    },
    [isAuthenticated, wishedIds],
  );

  return (
    <WishlistContext.Provider value={{ wishedIds, loading, toggle, refresh }}>
      {children}
    </WishlistContext.Provider>
  );
}
