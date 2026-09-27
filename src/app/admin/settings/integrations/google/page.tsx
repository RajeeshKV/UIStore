import type { Metadata } from "next";
import { AdminGoogleIntegrationClient } from "@/features/admin/settings/AdminGoogleIntegrationClient";

export const metadata: Metadata = { title: "Google OAuth" };

export default function AdminGoogleIntegrationPage() {
  return <AdminGoogleIntegrationClient />;
}
