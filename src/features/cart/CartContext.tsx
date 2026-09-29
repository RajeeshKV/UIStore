"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  useTransition,
} from "react";
import { cartApi, cartTokenStore } from "@/services/api/cart";
import { useToast } from "@/components/ui/Toast";
import { extractApiError } from "@/lib/utils";
import type { CartResponse } from "@/types/api";

// ── Types ─────────────────────────────────────────────────────────────────────

interface CartContextValue {
  cart: CartResponse | null;
  itemCount: number;
  isLoading: boolean;
  isMutating: boolean;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  addItem: (productId: string, variantId: string | undefined, quantity: number) => Promise<void>;
  updateItem: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within <CartProvider>");
  return ctx;
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { error: toastError } = useToast();
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, startMutation] = useTransition();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Mutation lock: prevents concurrent conflicting mutations
  const mutatingRef = useRef(false);

  // ── Persist cart token from response ───────────────────────────────────────
  function applyCartResponse(res: CartResponse) {
    if (res.cartId) cartTokenStore.set(res.cartId);
    setCart(res);
  }

  // ── Load cart on mount ─────────────────────────────────────────────────────
  const refresh = useCallback(async () => {
    const result = await cartApi.getCart();
    if (result.ok) {
      applyCartResponse(result.data);
    } else {
      setCart(null);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const load = async () => {
      const result = await cartApi.getCart();
      if (result.ok) {
        applyCartResponse(result.data);
      } else {
        setCart(null);
      }
      setIsLoading(false);
    };
    void load();

    const handler = () => void refresh();
    window.addEventListener("kromic:session-expired", handler);
    return () => window.removeEventListener("kromic:session-expired", handler);
  }, [refresh]);

  // ── Mutations ──────────────────────────────────────────────────────────────

  const addItem = useCallback(
    async (productId: string, variantId: string | undefined, quantity: number) => {
      if (mutatingRef.current) return;
      mutatingRef.current = true;

      startMutation(async () => {
        const result = await cartApi.addItem({ productId, variantId, quantity });
        if (result.ok) {
          applyCartResponse(result.data);
          setDrawerOpen(true);
        } else {
          toastError("Couldn't add to cart", extractApiError(result.error));
        }
        mutatingRef.current = false;
      });
    },
    [toastError],
  );

  const updateItem = useCallback(
    async (itemId: string, quantity: number) => {
      if (mutatingRef.current) return;
      if (quantity < 1) return;
      mutatingRef.current = true;

      startMutation(async () => {
        const result = await cartApi.updateItem(itemId, { quantity });
        if (result.ok) {
          applyCartResponse(result.data);
        } else {
          toastError("Update failed", extractApiError(result.error));
          await refresh();
        }
        mutatingRef.current = false;
      });
    },
    [toastError, refresh],
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      if (mutatingRef.current) return;
      mutatingRef.current = true;

      startMutation(async () => {
        const result = await cartApi.removeItem(itemId);
        if (result.ok) {
          applyCartResponse(result.data);
        } else {
          toastError("Couldn't remove item", "Please try again.");
          await refresh();
        }
        mutatingRef.current = false;
      });
    },
    [toastError, refresh],
  );

  const clearCart = useCallback(async () => {
    if (mutatingRef.current) return;
    mutatingRef.current = true;

    startMutation(async () => {
      const result = await cartApi.clearCart();
      if (result.ok) {
        applyCartResponse(result.data);
      } else {
        toastError("Couldn't clear cart", "Please try again.");
        await refresh();
      }
      mutatingRef.current = false;
    });
  }, [toastError, refresh]);

  const itemCount = cart?.totalItems ?? 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        itemCount,
        isLoading,
        isMutating,
        drawerOpen,
        openDrawer: () => setDrawerOpen(true),
        closeDrawer: () => setDrawerOpen(false),
        addItem,
        updateItem,
        removeItem,
        clearCart,
        refresh,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
