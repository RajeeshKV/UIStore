import type { Metadata } from "next";
import { StorefrontLayout } from "@/components/layout";
import { storeApi } from "@/services/api/store";
import { AccountLayout } from "@/features/account/AccountLayout";
import { OrderDetailClient } from "@/features/account/OrderDetailClient";

interface OrderDetailPageProps {
  params: Promise<{ orderId: string }>;
}

export const metadata: Metadata = {
  title: "Order Details",
  robots: { index: false, follow: false },
};

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { orderId } = await params;
  const [settingsRes, policiesRes] = await Promise.allSettled([
    storeApi.getSettings(), storeApi.getPolicies(),
  ]);
  const settings = settingsRes.status === "fulfilled" && settingsRes.value.ok ? settingsRes.value.data : null;
  const policies = policiesRes.status === "fulfilled" && policiesRes.value.ok ? policiesRes.value.data : [];
  const currency = settings?.currencyCode ?? "INR";
  const locale = settings?.culture ?? "en-IN";

  return (
    <StorefrontLayout settings={settings} policies={policies}>
      <AccountLayout>
        <OrderDetailClient orderId={orderId} currency={currency} locale={locale} />
      </AccountLayout>
    </StorefrontLayout>
  );
}
