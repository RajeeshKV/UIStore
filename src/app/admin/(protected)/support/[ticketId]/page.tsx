import type { Metadata } from "next";
import { AdminTicketDetailClient } from "@/features/admin/support/AdminTicketDetailClient";
import { adminTicketsApi } from "@/services/api/support";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Ticket Detail" };

interface Props { params: Promise<{ ticketId: string }> }

export default async function AdminTicketDetailPage({ params }: Props) {
  const { ticketId } = await params;
  const settingsRes = await adminTicketsApi.getSettings();
  const maxAttachments = settingsRes.ok ? settingsRes.data.maxAttachmentsPerComment : 6;
  return <AdminTicketDetailClient ticketId={ticketId} maxAttachments={maxAttachments} />;
}
