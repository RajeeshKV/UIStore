import type { Metadata } from "next";
import { StorefrontLayout } from "@/components/layout";
import { storeApi } from "@/services/api/store";
import { OrderSuccessClient } from "@/features/checkout/OrderSuccessClient";

interface OrderSuccessPageProps {
  params: Promise<{ orderId: string }>;
}

export const metadata: Metadata = {
  title: "Order Confirmed",
  robots: { index: false, follow: false },
};

export default async function OrderSuccessPage({ params }: OrderSuccessPageProps) {
  const { orderId } = await params;

  const [settingsRes, policiesRes] = await Promise.allSettled([
    storeApi.getSettings(),
    storeApi.getPolicies(),
  ]);
  const settings = settingsRes.status === "fulfilled" && settingsRes.value.ok ? settingsRes.value.data : null;
  const policies = policiesRes.status === "fulfilled" && policiesRes.value.ok ? policiesRes.value.data : [];

  const currency = settings?.currencyCode ?? "INR";
  const locale = settings?.culture ?? "en-IN";

  return (
    <StorefrontLayout settings={settings} policies={policies}>
      <OrderSuccessClient orderId={orderId} currency={currency} locale={locale} />
    </StorefrontLayout>
  );
}
