import type { Metadata } from "next";
import { StorefrontLayout } from "@/components/layout";
import { storeApi } from "@/services/api/store";
import { AccountLayout } from "@/features/account/AccountLayout";
import { TicketDetailClient } from "@/features/support/TicketDetailClient";
import { adminTicketsApi } from "@/services/api/support";
import { safeData } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Support Request",
  robots: { index: false, follow: false },
};

interface Props { params: Promise<{ ticketId: string }> }

export default async function TicketDetailPage({ params }: Props) {
  const { ticketId } = await params;
  const [settingsRes, policiesRes, supportSettingsRes] = await Promise.allSettled([
    storeApi.getSettings(),
    storeApi.getPolicies(),
    adminTicketsApi.getSettings(),
  ]);
  const maxAttachments = supportSettingsRes.status === "fulfilled" && supportSettingsRes.value.ok
    ? supportSettingsRes.value.data.maxAttachmentsPerComment
    : 6;

  return (
    <StorefrontLayout settings={safeData(settingsRes, null)} policies={safeData(policiesRes, [])}>
      <AccountLayout>
        <TicketDetailClient ticketId={ticketId} maxAttachments={maxAttachments} />
      </AccountLayout>
    </StorefrontLayout>
  );
}
