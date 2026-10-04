import type { Metadata } from "next";
import { StorefrontLayout } from "@/components/layout";
import { storeApi } from "@/services/api/store";
import { AccountLayout } from "@/features/account/AccountLayout";
import { TicketsClient } from "@/features/support/TicketsClient";
import { safeData } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Support",
  robots: { index: false, follow: false },
};

export default async function SupportPage() {
  const [settingsRes, policiesRes] = await Promise.allSettled([
    storeApi.getSettings(), storeApi.getPolicies(),
  ]);
  return (
    <StorefrontLayout settings={safeData(settingsRes, null)} policies={safeData(policiesRes, [])}>
      <AccountLayout>
        <TicketsClient />
      </AccountLayout>
    </StorefrontLayout>
  );
}
