import type { Metadata } from "next";
import { AdminOrdersClient } from "@/features/admin/orders/AdminOrdersClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Orders" };

export default function AdminOrdersPage() {
  return <AdminOrdersClient />;
}
