"use client";

import { useState, useCallback, useTransition, useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { VariantProductGrid } from "@/components/ui/VariantProductGrid";
import { Pagination } from "@/components/ui/Pagination";
import { CatalogToolbar } from "./CatalogToolbar";
import { CatalogFilterSidebar, CatalogFilterDrawer } from "./CatalogFilters";
import { CatalogBreadcrumb } from "./CatalogBreadcrumb";
import { staggerContainer } from "@/lib/motion";
import type { BreadcrumbItem } from "./CatalogBreadcrumb";
import type {
  GridRow,
  StorefrontCategoryResponse,
  StorefrontBrandResponse,
} from "@/types/api";
import type { CatalogParams } from "@/types/catalog";
import {
  buildCatalogUrl,
  catalogParamsToQueryString,
  SORT_OPTIONS,
  DEFAULT_SORT,
  DEFAULT_PAGE_SIZE,
} from "@/types/catalog";
import { storeApi } from "@/services/api/store";
import { Skeleton } from "@/components/ui/Skeleton";

interface CatalogShellProps {
  initialProducts: GridRow[];
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

  const [params, setParams]         = useState<CatalogParams>(initialParams);
  const [products, setProducts]     = useState<GridRow[]>(initialProducts);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [fetchError, setFetchError] = useState(false);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const applyParams = useCallback(
    (next: CatalogParams) => {
      if (lockedCategory) next.CategorySlug = lockedCategory;
      if (lockedBrand)    next.BrandSlug    = lockedBrand;

      setParams(next);
      setFetchError(false);

      const url = buildCatalogUrl(next, baseHref);
      window.history.pushState({}, "", url);

      startTransition(async () => {
        const result = await storeApi.getVariantGrid(catalogParamsToQueryString(next));
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
    const next: CatalogParams = { Page: 1, PageSize: params.PageSize ?? DEFAULT_PAGE_SIZE, InStockOnly: true };
    if (lockedCategory) next.CategorySlug = lockedCategory;
    if (lockedBrand)    next.BrandSlug    = lockedBrand;
    applyParams(next);
  }, [params.PageSize, lockedCategory, lockedBrand, applyParams]);

  const handleSortChange = useCallback(
    (value: string) => {
      const opt = SORT_OPTIONS.find((o) => o.value === value) ?? DEFAULT_SORT;
      handleParamChange({ SortBy: opt.sortBy, SortDirection: opt.sortDirection, Page: 1 });
    },
    [handleParamChange],
  );

  const handlePageChange  = useCallback((page: number) => handleParamChange({ Page: page }), [handleParamChange]);
  const handleClearSearch = useCallback(() => handleParamChange({ Search: undefined, Page: 1 }), [handleParamChange]);

  const visibleCategories  = lockedCategory ? [] : categories;
  const visibleBrands      = lockedBrand    ? [] : brands;
  const hasVisibleFilters  = visibleCategories.length > 0 || visibleBrands.length > 0;

  const filterProps = {
    params,
    categories: visibleCategories,
    brands: visibleBrands,
    loading: isPending,
    onParamChange: handleParamChange,
    onReset: handleReset,
  };

  return (
    <div className="bg-background min-h-screen">
      {/* ── Page header band ─────────────────────────────────────────── */}
      <section className="w-full bg-background py-8 border-b border-border">
        <div className="px-5 md:px-8 lg:px-10">
          {/* Breadcrumb + status */}
          <div className="flex items-center justify-between pb-5">
            {breadcrumbs && breadcrumbs.length > 0 && (
              <CatalogBreadcrumb items={breadcrumbs} />
            )}
            <div className="hidden sm:flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" aria-hidden="true" />
              <span className="text-[11px] font-bold tracking-widest uppercase text-foreground-muted">
                Live Inventory
              </span>
            </div>
          </div>

          {/* Hero header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
            <div>
              <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-foreground-muted mb-1">
                Catalog Index
              </p>
              <div className="flex items-baseline gap-4">
                <h1 className="text-[clamp(1.75rem,4vw,3rem)] font-extrabold text-foreground tracking-tight leading-none">
                  {heading}
                </h1>
                {totalCount > 0 && (
                  <span className="text-[16px] font-semibold text-foreground-muted">
                    / {totalCount} items
                  </span>
                )}
              </div>
              {description && (
                <p className="mt-2 text-[14px] text-foreground-muted max-w-2xl leading-relaxed">
                  {description}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Toolbar ───────────────────────────────────────────────────── */}
      <div ref={resultsRef} className="px-5 md:px-8 lg:px-10">
        <CatalogToolbar
          params={params}
          totalCount={totalCount}
          loading={isPending}
          onSortChange={handleSortChange}
          onOpenFilters={() => setFilterDrawerOpen(true)}
          onClearSearch={params.Search ? handleClearSearch : undefined}
        />
      </div>

      {/* ── Main layout: sidebar + product grid ──────────────────────── */}
      <div className="px-5 md:px-8 lg:px-10 py-6">
        <div className={cn("flex gap-8", !hasVisibleFilters && "lg:gap-0")}>

          {/* Desktop filter sidebar */}
          {hasVisibleFilters && <CatalogFilterSidebar {...filterProps} />}

          {/* Product area */}
          <div className="flex-1 min-w-0">
            {isPending ? (
              <CatalogGridSkeleton />
            ) : (
              <motion.div
                key={`${params.Page}-${params.SortBy}-${params.Search}`}
                variants={shouldReduce ? undefined : staggerContainer(0.04, 0)}
                initial="hidden"
                animate="visible"
              >
                <VariantProductGrid
                  rows={products}
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

            {/* Pagination — note: totalCount is row count, not product count */}
            {!fetchError && totalPages > 1 && !isPending && (
              <div className="mt-12 mb-4 flex flex-col items-center gap-3">
                <Pagination
                  page={params.Page ?? 1}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
                <p className="text-[12px] text-foreground-muted">
                  Page {params.Page ?? 1} of {totalPages} &mdash;{" "}
                  {totalCount} item{totalCount !== 1 ? "s" : ""}
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

// ── Loading skeleton for product grid ────────────────────────────────────────

function CatalogGridSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading products"
      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
    >
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} aria-hidden="true" className="flex flex-col gap-2">
          <Skeleton className="aspect-square w-full rounded-2xl" />
          <Skeleton className="h-3.5 w-3/4" />
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-9 w-full rounded-lg" />
        </div>
      ))}
    </div>
  );
}
