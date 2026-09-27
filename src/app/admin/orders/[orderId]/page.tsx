import type { Metadata } from "next";
import { AdminOrderDetailClient } from "@/features/admin/orders/AdminOrderDetailClient";

export const metadata: Metadata = { title: "Order Detail" };

interface Props {
  params: Promise<{ orderId: string }>;
}

export default async function AdminOrderDetailPage({ params }: Props) {
  const { orderId } = await params;
  return <AdminOrderDetailClient orderId={orderId} />;
}
