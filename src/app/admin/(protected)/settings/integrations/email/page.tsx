import type { Metadata } from "next";
import { AdminEmailIntegrationClient } from "@/features/admin/settings/AdminEmailIntegrationClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Email" };

export default function AdminEmailIntegrationPage() {
  return <AdminEmailIntegrationClient />;
}
