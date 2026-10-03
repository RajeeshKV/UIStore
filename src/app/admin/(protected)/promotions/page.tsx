import type { Metadata } from "next";
import { AdminPromotionsClient } from "@/features/admin/promotions/AdminPromotionsClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Promotions" };

export default function AdminPromotionsPage() {
  return <AdminPromotionsClient />;
}
