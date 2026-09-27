"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { SORT_OPTIONS } from "@/types/catalog";

interface CatalogSortProps {
  value: string; // e.g. "price:asc"
  onChange: (value: string) => void;
  className?: string;
}

export function CatalogSort({ value, onChange, className }: CatalogSortProps) {
  return (
    <div className={cn("relative inline-flex items-center", className)}>
      <label htmlFor="catalog-sort" className="sr-only">
        Sort products
      </label>
      <select
        id="catalog-sort"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "appearance-none h-9 pl-3 pr-8 rounded-md",
          "border border-border bg-surface-elevated",
          "text-body-sm text-foreground",
          "focus:outline-none focus:border-foreground",
          "transition-colors duration-150 cursor-pointer",
        )}
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-foreground-muted pointer-events-none"
        aria-hidden="true"
      />
    </div>
  );
}
