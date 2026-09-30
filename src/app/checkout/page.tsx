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
  const storeName = settings?.businessName ?? "Kromic Store";
  // These are hints for initial payment method selection only.
  // Availability is authoritative from CheckoutSummaryResponse.paymentMethods[].
  const razorpayEnabled = settings?.payment?.razorpayEnabled ?? false;
  const codEnabled = settings?.payment?.codEnabled ?? settings?.delivery?.codEnabled ?? false;

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
