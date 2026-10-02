"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { CatalogSort } from "./CatalogSort";
import type { CatalogParams } from "@/types/catalog";
import { DEFAULT_SORT, SORT_OPTIONS } from "@/types/catalog";

interface CatalogToolbarProps {
  params: CatalogParams;
  totalCount: number;
  loading?: boolean;
  onSortChange: (value: string) => void;
  onOpenFilters: () => void;
  onClearSearch?: () => void;
  className?: string;
}

export function CatalogToolbar({
  params,
  totalCount,
  loading = false,
  onSortChange,
  onOpenFilters,
  onClearSearch,
  className,
}: CatalogToolbarProps) {
  const currentSort = params.SortBy
    ? SORT_OPTIONS.find(
        (o) => o.sortBy === params.SortBy && o.sortDirection === params.SortDirection,
      )?.value ?? DEFAULT_SORT.value
    : DEFAULT_SORT.value;

  const activeFilterCount = [
    params.CategorySlug,
    params.BrandSlug,
    params.InStockOnly,
    params.MinPrice != null,
    params.MaxPrice != null,
  ].filter(Boolean).length;

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 py-4 md:py-5",
        "border-b border-[#e1e2e4]",
        className,
      )}
    >
      {/* Left: filter button + result summary */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Mobile filter button — pill style */}
        <button
          onClick={onOpenFilters}
          aria-label={`Open filters${activeFilterCount > 0 ? ` (${activeFilterCount} active)` : ""}`}
          className={cn(
            "lg:hidden flex items-center gap-2 h-9 px-4 rounded-full shrink-0",
            "border border-[#e1e2e4] bg-white text-[13px] font-semibold text-[#191c1e]",
            "hover:border-[#0D0D0D] hover:shadow-sm transition-all duration-150",
          )}
        >
          <SlidersHorizontal className="size-3.5" aria-hidden="true" />
          Filters
          {activeFilterCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0D0D0D] text-white text-[10px] font-bold leading-none">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Result summary */}
        <div className="min-w-0">
          {loading ? (
            <div className="h-4 w-28 animate-skeleton bg-[#edeef0] rounded-lg" aria-hidden="true" />
          ) : (
            <p className="text-[13px] text-[#444748] truncate">
              {params.Search ? (
                <>
                  <span className="font-bold text-[#191c1e]">{totalCount}</span>
                  {" results for "}
                  <span className="font-bold text-[#191c1e]">&ldquo;{params.Search}&rdquo;</span>
                  {onClearSearch && (
                    <button
                      onClick={onClearSearch}
                      aria-label="Clear search"
                      className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#edeef0] text-[#444748] hover:bg-[#e1e2e4] hover:text-[#191c1e] transition-colors"
                    >
                      <X className="size-2.5" />
                    </button>
                  )}
                </>
              ) : (
                <>
                  <span className="font-bold text-[#191c1e]">{totalCount}</span>
                  {" product"}{totalCount !== 1 ? "s" : ""}
                </>
              )}
            </p>
          )}
        </div>
      </div>

      {/* Right: sort dropdown */}
      <CatalogSort value={currentSort} onChange={onSortChange} />
    </div>
  );
}
