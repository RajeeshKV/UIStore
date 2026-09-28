import type { Metadata } from "next";
import { AdminCategoriesClient } from "@/features/admin/categories/AdminCategoriesClient";

export const metadata: Metadata = { title: "Categories" };

export default function AdminCategoriesPage() {
  return <AdminCategoriesClient />;
}
