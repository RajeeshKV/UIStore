import { Footer } from "./Footer";
import { CartProvider } from "@/features/cart/CartContext";
import { CartDrawer } from "@/features/cart/CartDrawer";
import { CartAwareHeader } from "./CartAwareHeader";
import { AuthProvider } from "@/features/auth/AuthContext";
import { WishlistProvider } from "@/features/wishlist/WishlistContext";
import { PendingPaymentResumeDialog } from "@/features/checkout/PendingPaymentResumeDialog";
import type {
  PublicBusinessSettingsResponse,
  StorePolicyResponse,
} from "@/types/api";

interface StorefrontLayoutProps {
  children: React.ReactNode;
  settings?: PublicBusinessSettingsResponse | null;
  policies?: StorePolicyResponse[];
}

/**
 * Shell layout for all customer-facing storefront pages.
 * CartProvider wraps the entire shell so all children share one cart state.
 * CartDrawer is rendered here so it is available app-wide without re-mounting.
 */
export function StorefrontLayout({
  children,
  settings,
  policies,
}: StorefrontLayoutProps) {
  const currency = settings?.currencyCode ?? "INR";
  const locale = settings?.culture ?? "en-IN";
  // Normalize null to empty array — API may return null when backend is unreachable
  const policyList = policies ?? [];

  return (
    <AuthProvider>
      <WishlistProvider>
        <CartProvider>
          <div className="flex flex-col min-h-screen">
            <CartAwareHeader
              storeName={settings?.businessName ?? "Shopey"}
              logoUrl={settings?.logoUrl}
            />
            <main id="main-content" className="flex-1">
              {children}
            </main>
            <Footer settings={settings} policies={policyList} />
          </div>
          <CartDrawer currency={currency} locale={locale} />
          <PendingPaymentResumeDialog />
        </CartProvider>
      </WishlistProvider>
    </AuthProvider>
  );
}
