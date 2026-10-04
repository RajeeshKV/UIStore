import type { Metadata } from "next";
import { AdminSupportSettingsClient } from "@/features/admin/support/AdminSupportSettingsClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Support Settings" };

export default function AdminSupportSettingsPage() {
  return <AdminSupportSettingsClient />;
}
