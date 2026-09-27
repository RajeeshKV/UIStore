import type { Metadata } from "next";
import { AdminBasicSettingsClient } from "@/features/admin/settings/AdminBasicSettingsClient";

export const metadata: Metadata = { title: "Basic Info" };

export default function AdminBasicSettingsPage() {
  return <AdminBasicSettingsClient />;
}
