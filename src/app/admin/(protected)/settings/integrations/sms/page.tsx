import type { Metadata } from "next";
import { AdminSmsIntegrationClient } from "@/features/admin/settings/AdminSmsIntegrationClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "SMS" };

export default function AdminSmsIntegrationPage() {
  return <AdminSmsIntegrationClient />;
}
