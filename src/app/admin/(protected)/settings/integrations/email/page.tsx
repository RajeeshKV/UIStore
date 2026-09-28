import type { Metadata } from "next";
import { AdminEmailIntegrationClient } from "@/features/admin/settings/AdminEmailIntegrationClient";

export const metadata: Metadata = { title: "Email" };

export default function AdminEmailIntegrationPage() {
  return <AdminEmailIntegrationClient />;
}
