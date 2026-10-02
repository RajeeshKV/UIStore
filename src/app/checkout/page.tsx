import type { Metadata } from "next";
import { StorefrontLayout } from "@/components/layout";
import { storeApi } from "@/services/api/store";
import { CheckoutClient } from "@/features/checkout/CheckoutClient";
import { safeData } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const [settingsRes, policiesRes] = await Promise.allSettled([
    storeApi.getSettings(),
    storeApi.getPolicies(),
  ]);
  const settings = safeData(settingsRes, null);
  const policies = safeData(policiesRes, []);

  const currency = settings?.currencyCode ?? "INR";
  const locale = settings?.culture ?? "en-IN";
  const storeName = settings?.businessName ?? "Shopey";

  // These are hints only — authoritative values come from CheckoutSummaryResponse.paymentMethods[].
  const razorpayEnabled = settings?.payment?.razorpayEnabled ?? false;
  // codEnabled drives the initial UI: hide the COD option unless the admin has configured it.
  // delivery.codEnabled is the canonical field (set from Shipping settings).
  const codEnabled = settings?.delivery?.codEnabled ?? false;

  return (
    <StorefrontLayout settings={settings} policies={policies}>
      <CheckoutClient
        currency={currency}
        locale={locale}
        storeName={storeName}
        razorpayEnabled={razorpayEnabled}
        codEnabled={codEnabled}
      />
    </StorefrontLayout>
  );
}
