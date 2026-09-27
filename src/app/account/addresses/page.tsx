import type { Metadata } from "next";
import { StorefrontLayout } from "@/components/layout";
import { storeApi } from "@/services/api/store";
import { AccountLayout } from "@/features/account/AccountLayout";
import { AddressesClient } from "@/features/account/AddressesClient";
import { safeData } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Addresses",
  robots: { index: false, follow: false },
};

export default async function AddressesPage() {
  const [settingsRes, policiesRes] = await Promise.allSettled([
    storeApi.getSettings(), storeApi.getPolicies(),
  ]);
  const settings = safeData(settingsRes, null);
  const policies = safeData(policiesRes, []);

  return (
    <StorefrontLayout settings={settings} policies={policies}>
      <AccountLayout>
        <AddressesClient />
      </AccountLayout>
    </StorefrontLayout>
  );
}
