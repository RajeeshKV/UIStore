import type { Metadata } from "next";
import { StorefrontLayout } from "@/components/layout";
import { storeApi } from "@/services/api/store";
import { CartPageClient } from "@/features/cart/CartPageClient";
import { safeData } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your Cart",
  robots: { index: false, follow: false },
};

export default async function CartPage() {
  const [settingsRes, policiesRes] = await Promise.allSettled([
    storeApi.getSettings(),
    storeApi.getPolicies(),
  ]);
  const settings = safeData(settingsRes, null);
  const policies = safeData(policiesRes, []);

  const currency = settings?.currencyCode ?? "INR";
  const locale = settings?.culture ?? "en-IN";

  return (
    <StorefrontLayout settings={settings} policies={policies}>
      <CartPageClient currency={currency} locale={locale} />
    </StorefrontLayout>
  );
}
