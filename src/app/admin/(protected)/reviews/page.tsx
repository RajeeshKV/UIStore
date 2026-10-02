import type { Metadata } from "next";
import { AdminReviewsClient } from "@/features/admin/reviews/AdminReviewsClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Reviews — Admin",
};

export default function AdminReviewsPage() {
  return <AdminReviewsClient />;
}
