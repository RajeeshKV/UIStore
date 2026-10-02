import type { Metadata } from "next";
import { StorefrontLayout } from "@/components/layout";
import { storeApi } from "@/services/api/store";
import { AccountLayout } from "@/features/account/AccountLayout";
import { MyReviewsClient } from "@/features/reviews/MyReviewsClient";
import { safeData } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My Reviews",
  robots: { index: false, follow: false },
};

export default async function MyReviewsPage() {
  const [settingsRes, policiesRes] = await Promise.allSettled([
    storeApi.getSettings(),
    storeApi.getPolicies(),
  ]);
  const settings = safeData(settingsRes, null);
  const policies = safeData(policiesRes, []);

  return (
    <StorefrontLayout settings={settings} policies={policies}>
      <AccountLayout>
        <MyReviewsClient />
      </AccountLayout>
    </StorefrontLayout>
  );
}
