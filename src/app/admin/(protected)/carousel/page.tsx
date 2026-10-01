import type { Metadata } from "next";
import { AdminCarouselClient } from "@/features/admin/carousel/AdminCarouselClient";

export const metadata: Metadata = { title: "Carousel" };

export default function AdminCarouselPage() {
  return <AdminCarouselClient />;
}
