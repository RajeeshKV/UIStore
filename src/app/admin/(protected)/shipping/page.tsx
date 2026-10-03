import type { Metadata } from "next";
import { AdminShippingClient } from "@/features/admin/settings/AdminShippingClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Shipping" };

export default function AdminShippingPage() {
  return <AdminShippingClient />;
}
