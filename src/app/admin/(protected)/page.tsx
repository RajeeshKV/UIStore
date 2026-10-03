import type { Metadata } from "next";
import { AdminDashboardClient } from "@/features/admin/dashboard/AdminDashboardClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Dashboard" };

export default function AdminDashboardPage() {
  return <AdminDashboardClient />;
}
