import type { Metadata } from "next";
import { StorefrontLayout } from "@/components/layout";
import { storeApi } from "@/services/api/store";
import { AccountLayout } from "@/features/account/AccountLayout";
import { AccountOverviewClient } from "@/features/account/AccountOverviewClient";
import { safeData } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My Account",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const [settingsRes, policiesRes] = await Promise.allSettled([
    storeApi.getSettings(), storeApi.getPolicies(),
  ]);
  const settings = safeData(settingsRes, null);
  const policies = safeData(policiesRes, []);
  const currency = settings?.currencyCode ?? "INR";
  const locale = settings?.culture ?? "en-IN";

  return (
    <StorefrontLayout settings={settings} policies={policies}>
      <AccountLayout>
        <AccountOverviewClient currency={currency} locale={locale} />
      </AccountLayout>
    </StorefrontLayout>
  );
}
