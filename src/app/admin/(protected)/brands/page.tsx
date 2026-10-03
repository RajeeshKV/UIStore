import type { Metadata } from "next";
import { AdminBrandsClient } from "@/features/admin/brands/AdminBrandsClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Brands" };

export default function AdminBrandsPage() {
  return <AdminBrandsClient />;
}
