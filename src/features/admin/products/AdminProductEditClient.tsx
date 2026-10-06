"use client";

import { useEffect, useState, useCallback } from "react";
import { adminProductsApi, adminCategoriesApi, adminBrandsApi } from "@/services/api/admin";
import { ProductForm } from "./ProductForm";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import type { ProductResponse, CategoryResponse, BrandResponse } from "@/types/api";

interface AdminProductEditClientProps {
  productId: string;
}

export function AdminProductEditClient({ productId }: AdminProductEditClientProps) {
  const [product, setProduct] = useState<ProductResponse | null>(null);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [brands, setBrands] = useState<BrandResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (showLoadingSpinner = false) => {
    // Only show the skeleton spinner on the very first load (or an explicit retry).
    // Background refreshes (e.g. after publish/save) must NOT set loading=true because
    // that unmounts ProductForm, which immediately remounts it, re-triggering onRefresh
    // and causing an infinite reload loop.
    if (showLoadingSpinner) setLoading(true);
    setError(null);
    const [productRes, catRes, brandRes] = await Promise.all([
      adminProductsApi.getById(productId),
      adminCategoriesApi.list(),
      adminBrandsApi.list(),
    ]);
    if (!productRes.ok) {
      setError(
        productRes.error && "message" in productRes.error
          ? productRes.error.message
          : "Failed to load product.",
      );
    } else {
      setProduct(productRes.data);
    }
    if (catRes.ok) setCategories(catRes.data);
    if (brandRes.ok) setBrands(brandRes.data);
    setLoading(false);
  }, [productId]);

  // First load — show the skeleton
  useEffect(() => { void load(true); }, [load]);

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-9 w-32" />
        </div>
        <Skeleton className="h-64 w-full rounded-lg" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
    );
  }

  if (error || !product) {
    return <ErrorState title="Product not found" description={error ?? "This product could not be loaded."} onRetry={() => load(true)} />;
  }

  return (
    <ProductForm
      product={product}
      categories={categories}
      brands={brands}
      onRefresh={load}
    />
  );
}
