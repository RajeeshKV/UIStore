"use client";

import { useEffect, useState } from "react";
import { adminCategoriesApi, adminBrandsApi } from "@/services/api/admin";
import { ProductForm } from "@/features/admin/products/ProductForm";
import { Skeleton } from "@/components/ui/Skeleton";
import type { CategoryResponse, BrandResponse } from "@/types/api";

export const dynamic = "force-dynamic";

export default function AdminNewProductPage() {
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [brands, setBrands] = useState<BrandResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([adminCategoriesApi.list(), adminBrandsApi.list()]).then(
      ([catRes, brandRes]) => {
        if (catRes.ok) setCategories(catRes.data);
        if (brandRes.ok) setBrands(brandRes.data);
        setLoading(false);
      },
    );
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  return <ProductForm product={null} categories={categories} brands={brands} />;
}
