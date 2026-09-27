import type { Metadata } from "next";
import { AdminPaymentIntegrationClient } from "@/features/admin/settings/AdminPaymentIntegrationClient";

export const metadata: Metadata = { title: "Payment" };

export default function AdminPaymentIntegrationPage() {
  return <AdminPaymentIntegrationClient />;
}
