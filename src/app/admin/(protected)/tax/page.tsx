import type { Metadata } from "next";
import { AdminTaxClient } from "@/features/admin/settings/AdminTaxClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Tax" };

export default function AdminTaxPage() {
  return <AdminTaxClient />;
}
