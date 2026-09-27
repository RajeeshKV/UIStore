import type { Metadata } from "next";
import { StorefrontLayout } from "@/components/layout";
import { storeApi } from "@/services/api/store";
import { CheckoutClient } from "@/features/checkout/CheckoutClient";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const [settingsRes, policiesRes] = await Promise.allSettled([
    storeApi.getSettings(),
    storeApi.getPolicies(),
  ]);
  const settings = settingsRes.status === "fulfilled" && settingsRes.value.ok ? settingsRes.value.data : null;
  const policies = policiesRes.status === "fulfilled" && policiesRes.value.ok ? policiesRes.value.data : [];

  const currency = settings?.currencyCode ?? "INR";
  const locale = settings?.culture ?? "en-IN";
  const storeName = settings?.businessName ?? "Kromic Store";
  const codEnabled = settings?.delivery?.codEnabled ?? false;
  const freeShippingThreshold = settings?.delivery?.freeShippingThreshold;
  const flatFee = settings?.delivery?.flatFeeAmount ?? 0;
  const codExtraFee = settings?.delivery?.codExtraFee ?? 0;

  return (
    <StorefrontLayout settings={settings} policies={policies}>
      <CheckoutClient
        currency={currency}
        locale={locale}
        storeName={storeName}
        codEnabled={codEnabled}
        freeShippingThreshold={freeShippingThreshold}
        flatDeliveryFee={flatFee}
        codExtraFee={codExtraFee}
      />
    </StorefrontLayout>
  );
}
