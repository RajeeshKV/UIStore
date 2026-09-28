import type { Metadata } from "next";
import { AdminProductEditClient } from "@/features/admin/products/AdminProductEditClient";

export const metadata: Metadata = { title: "Edit Product" };

interface Props {
  params: Promise<{ productId: string }>;
}

export default async function AdminProductEditPage({ params }: Props) {
  const { productId } = await params;
  return <AdminProductEditClient productId={productId} />;
}
