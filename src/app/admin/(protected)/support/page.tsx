import type { Metadata } from "next";
import { AdminTicketsClient } from "@/features/admin/support/AdminTicketsClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Support Queue" };

export default function AdminSupportPage() {
  return <AdminTicketsClient />;
}
