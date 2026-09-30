"use client";

import { useState, useCallback, useTransition, useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { ProductGrid } from "@/components/ui/ProductGrid";
import { Pagination } from "@/components/ui/Pagination";
import { CatalogToolbar } from "./CatalogToolbar";
import { CatalogFilterSidebar, CatalogFilterDrawer } from "./CatalogFilters";
import { CatalogBreadcrumb } from "./CatalogBreadcrumb";
import { staggerContainer } from "@/lib/motion";
import type { BreadcrumbItem } from "./CatalogBreadcrumb";
import type {
  StorefrontProductSummaryResponse,
  StorefrontCategoryResponse,
  StorefrontBrandResponse,
} from "@/types/api";
import type { CatalogParams } from "@/types/catalog";
import {
  buildCatalogUrl,
  catalogParamsToApiParams,
  SORT_OPTIONS,
  DEFAULT_SORT,
  DEFAULT_PAGE_SIZE,
} from "@/types/catalog";
import { storeApi } from "@/services/api/store";

interface CatalogShellProps {
  initialProducts: StorefrontProductSummaryResponse[];
  initialTotalCount: number;
  initialTotalPages: number;
  initialParams: CatalogParams;
  categories: StorefrontCategoryResponse[];
  brands: StorefrontBrandResponse[];
  currency: string;
  locale: string;
  baseHref?: string;
  breadcrumbs?: BreadcrumbItem[];
  heading?: string;
  description?: string;
  lockedCategory?: string;
  lockedBrand?: string;
}

export function CatalogShell({
  initialProducts,
  initialTotalCount,
  initialTotalPages,
  initialParams,
  categories,
  brands,
  currency,
  locale,
  baseHref = "/shop",
  breadcrumbs,
  heading = "All Products",
  description,
  lockedCategory,
  lockedBrand,
}: CatalogShellProps) {
  const shouldReduce = useReducedMotion();
  const [isPending, startTransition] = useTransition();

  // Client state — seeded from server-rendered initial values.
  // Subsequent filter/sort/page interactions update this state + URL
  // without a full server round-trip (window.history.pushState + client fetch).
  const [params, setParams] = useState<CatalogParams>(initialParams);
  const [products, setProducts] = useState(initialProducts);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [fetchError, setFetchError] = useState(false);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const applyParams = useCallback(
    (next: CatalogParams) => {
      if (lockedCategory) next.CategorySlug = lockedCategory;
      if (lockedBrand) next.BrandSlug = lockedBrand;

      setParams(next);
      setFetchError(false);

      // Reflect state in URL for shareability / back-forward
      const url = buildCatalogUrl(next, baseHref);
      window.history.pushState({}, "", url);

      startTransition(async () => {
        const result = await storeApi.getProducts(catalogParamsToApiParams(next));
        if (result.ok) {
          setProducts(result.data.items);
          setTotalCount(result.data.totalCount);
          setTotalPages(result.data.totalPages);
          setFetchError(false);
          resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        } else {
          setFetchError(true);
        }
      });
    },
    [baseHref, lockedCategory, lockedBrand],
  );

  const handleParamChange = useCallback(
    (patch: Partial<CatalogParams>) => applyParams({ ...params, ...patch }),
    [params, applyParams],
  );

  const handleReset = useCallback(() => {
    const next: CatalogParams = { Page: 1, PageSize: params.PageSize ?? DEFAULT_PAGE_SIZE };
    if (lockedCategory) next.CategorySlug = lockedCategory;
    if (lockedBrand) next.BrandSlug = lockedBrand;
    applyParams(next);
  }, [params.PageSize, lockedCategory, lockedBrand, applyParams]);

  const handleSortChange = useCallback(
    (value: string) => {
      const opt = SORT_OPTIONS.find((o) => o.value === value) ?? DEFAULT_SORT;
      handleParamChange({ SortBy: opt.sortBy, SortDirection: opt.sortDirection, Page: 1 });
    },
    [handleParamChange],
  );

  const handlePageChange = useCallback(
    (page: number) => handleParamChange({ Page: page }),
    [handleParamChange],
  );

  const handleClearSearch = useCallback(
    () => handleParamChange({ Search: undefined, Page: 1 }),
    [handleParamChange],
  );

  const visibleCategories = lockedCategory ? [] : categories;
  const visibleBrands = lockedBrand ? [] : brands;
  const hasVisibleFilters = visibleCategories.length > 0 || visibleBrands.length > 0;

  const filterProps = {
    params,
    categories: visibleCategories,
    brands: visibleBrands,
    loading: isPending,
    onParamChange: handleParamChange,
    onReset: handleReset,
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container-x mx-auto">

        {/* Breadcrumb */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="pt-6">
            <CatalogBreadcrumb items={breadcrumbs} />
          </div>
        )}

        {/* Page heading */}
        <div className="pt-4 pb-0">
          <h1 className="text-h3 font-bold text-foreground">{heading}</h1>
          {description && (
            <p className="mt-1 text-body-sm text-foreground-muted max-w-2xl">
              {description}
            </p>
          )}
        </div>

        {/* Toolbar */}
        <div ref={resultsRef}>
          <CatalogToolbar
            params={params}
            totalCount={totalCount}
            loading={isPending}
            onSortChange={handleSortChange}
            onOpenFilters={() => setFilterDrawerOpen(true)}
            onClearSearch={params.Search ? handleClearSearch : undefined}
          />
        </div>

        {/* Main layout */}
        <div className={cn("flex gap-8 py-6", !hasVisibleFilters && "lg:gap-0")}>

          {/* Desktop sidebar */}
          {hasVisibleFilters && <CatalogFilterSidebar {...filterProps} />}

          {/* Product area */}
          <div className="flex-1 min-w-0">
            {isPending ? (
              <div
                aria-busy="true"
                aria-label="Loading products"
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-3"
              >
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} aria-hidden="true" className="flex flex-col gap-3">
                    <div className="animate-skeleton bg-muted aspect-square rounded-lg" />
                    <div className="animate-skeleton bg-muted h-3 w-3/4 rounded" />
                    <div className="animate-skeleton bg-muted h-4 w-full rounded" />
                    <div className="animate-skeleton bg-muted h-4 w-2/3 rounded" />
                    <div className="animate-skeleton bg-muted h-9 w-full rounded-md" />
                  </div>
                ))}
              </div>
            ) : (
              <motion.div
                key={`${params.Page}-${params.SortBy}-${params.Search}`}
                variants={shouldReduce ? undefined : staggerContainer(0.04, 0)}
                initial="hidden"
                animate="visible"
              >
                <ProductGrid
                  products={products}
                  error={fetchError}
                  onRetry={() => applyParams(params)}
                  currency={currency}
                  locale={locale}
                  cols={hasVisibleFilters ? 3 : 4}
                  eagerCount={4}
                  skeletonCount={8}
                />
              </motion.div>
            )}

            {/* Pagination */}
            {!fetchError && totalPages > 1 && !isPending && (
              <div className="mt-10 mb-4">
                <Pagination
                  page={params.Page ?? 1}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
                <p className="text-center text-caption text-foreground-muted mt-3">
                  Page {params.Page ?? 1} of {totalPages} &mdash;{" "}
                  {totalCount} product{totalCount !== 1 ? "s" : ""}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      {hasVisibleFilters && (
        <CatalogFilterDrawer
          {...filterProps}
          open={filterDrawerOpen}
          onClose={() => setFilterDrawerOpen(false)}
        />
      )}
    </div>
  );
}
