import type { Metadata } from "next";
import { AdminSeoClient } from "@/features/admin/settings/AdminSeoClient";

export const metadata: Metadata = { title: "SEO" };

export default function AdminSeoPage() {
  return <AdminSeoClient />;
}
