import type { Metadata } from "next";
import { AdminBrandsClient } from "@/features/admin/brands/AdminBrandsClient";

export const metadata: Metadata = { title: "Brands" };

export default function AdminBrandsPage() {
  return <AdminBrandsClient />;
}
