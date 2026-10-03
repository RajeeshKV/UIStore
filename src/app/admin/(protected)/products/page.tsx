import type { Metadata } from "next";
import { AdminProductsClient } from "@/features/admin/products/AdminProductsClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Products" };

export default function AdminProductsPage() {
  return <AdminProductsClient />;
}
