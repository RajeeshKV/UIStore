import type { Metadata } from "next";
import { AdminPoliciesClient } from "@/features/admin/settings/AdminPoliciesClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Policies" };

export default function AdminPoliciesPage() {
  return <AdminPoliciesClient />;
}
