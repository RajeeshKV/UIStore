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
        "flex items-center justify-between gap-3 py-4",
        "border-b border-border",
        className,
      )}
    >
      {/* Left: result count + search context */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Mobile filter button */}
        <button
          onClick={onOpenFilters}
          aria-label={`Open filters${activeFilterCount > 0 ? ` (${activeFilterCount} active)` : ""}`}
          className={cn(
            "lg:hidden flex items-center gap-1.5 h-9 px-3 rounded-md",
            "border border-border text-body-sm text-foreground",
            "hover:bg-muted transition-colors shrink-0",
          )}
        >
          <SlidersHorizontal className="size-3.5" aria-hidden="true" />
          Filters
          {activeFilterCount > 0 && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-semibold">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Result summary */}
        <div className="min-w-0">
          {loading ? (
            <div className="h-4 w-28 animate-skeleton bg-muted rounded" aria-hidden="true" />
          ) : (
            <p className="text-body-sm text-foreground-muted truncate">
              {params.Search ? (
                <>
                  <span className="font-medium text-foreground">{totalCount}</span>
                  {" results for "}
                  <span className="font-medium text-foreground">&ldquo;{params.Search}&rdquo;</span>
                  {onClearSearch && (
                    <button
                      onClick={onClearSearch}
                      aria-label="Clear search"
                      className="ml-1.5 inline-flex items-center text-foreground-muted hover:text-foreground"
                    >
                      <X className="size-3" />
                    </button>
                  )}
                </>
              ) : (
                <>
                  <span className="font-medium text-foreground">{totalCount}</span>
                  {" product"}{totalCount !== 1 ? "s" : ""}
                </>
              )}
            </p>
          )}
        </div>
      </div>

      {/* Right: sort */}
      <CatalogSort value={currentSort} onChange={onSortChange} />
    </div>
  );
}
