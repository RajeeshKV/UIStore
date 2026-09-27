"use client";

import { useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Drawer } from "@/components/ui/Drawer";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import type { StorefrontCategoryResponse, StorefrontBrandResponse } from "@/types/api";
import type { CatalogParams } from "@/types/catalog";
import { transitions } from "@/lib/motion";

interface CatalogFiltersProps {
  params: CatalogParams;
  categories: StorefrontCategoryResponse[];
  brands: StorefrontBrandResponse[];
  loading?: boolean;
  onParamChange: (patch: Partial<CatalogParams>) => void;
  onReset: () => void;
}

// ── Shared filter panel ───────────────────────────────────────────────────────

function FilterPanel({
  params,
  categories,
  brands,
  loading,
  onParamChange,
  onReset,
}: CatalogFiltersProps) {
  const hasActiveFilters = !!(
    params.CategorySlug ||
    params.BrandSlug ||
    params.InStockOnly ||
    params.MinPrice != null ||
    params.MaxPrice != null
  );

  return (
    <div className="flex flex-col gap-1">
      {/* Clear all */}
      {hasActiveFilters && (
        <div className="pb-3 mb-1 border-b border-border">
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 text-body-sm text-foreground hover:text-foreground-muted transition-colors"
          >
            <X className="size-3.5" aria-hidden="true" />
            Clear all filters
          </button>
        </div>
      )}

      {/* Categories */}
      <FilterSection title="Category" defaultOpen>
        {loading ? (
          <FilterSkeleton rows={5} />
        ) : categories.length === 0 ? null : (
          <ul role="list" className="flex flex-col gap-0.5">
            {categories.map((cat) => (
              <li key={cat.id}>
                <FilterCheckbox
                  label={cat.name ?? cat.id}
                  sublabel={cat.productCount != null ? String(cat.productCount) : undefined}
                  checked={params.CategorySlug === cat.slug}
                  onChange={(checked) =>
                    onParamChange({
                      CategorySlug: checked ? cat.slug : undefined,
                      Page: 1,
                    })
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </FilterSection>

      {/* Brands */}
      <FilterSection title="Brand" defaultOpen={brands.length <= 8}>
        {loading ? (
          <FilterSkeleton rows={4} />
        ) : brands.length === 0 ? null : (
          <ul role="list" className="flex flex-col gap-0.5">
            {brands.map((brand) => (
              <li key={brand.id}>
                <FilterCheckbox
                  label={brand.name ?? brand.id}
                  sublabel={brand.productCount != null ? String(brand.productCount) : undefined}
                  checked={params.BrandSlug === brand.slug}
                  onChange={(checked) =>
                    onParamChange({
                      BrandSlug: checked ? brand.slug : undefined,
                      Page: 1,
                    })
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </FilterSection>

      {/* Price range — backend supports MinPrice / MaxPrice */}
      <FilterSection title="Price Range">
        <PriceRangeFilter
          min={params.MinPrice}
          max={params.MaxPrice}
          onChange={(min, max) =>
            onParamChange({ MinPrice: min, MaxPrice: max, Page: 1 })
          }
        />
      </FilterSection>

      {/* Availability */}
      <FilterSection title="Availability" defaultOpen>
        <FilterCheckbox
          label="In Stock Only"
          checked={!!params.InStockOnly}
          onChange={(checked) =>
            onParamChange({ InStockOnly: checked || undefined, Page: 1 })
          }
        />
      </FilterSection>
    </div>
  );
}

// ── Desktop sidebar ───────────────────────────────────────────────────────────

export function CatalogFilterSidebar(props: CatalogFiltersProps) {
  return (
    <aside
      aria-label="Product filters"
      className="hidden lg:block w-56 shrink-0 pt-2"
    >
      <p className="text-label font-semibold text-foreground mb-4 uppercase tracking-wider">
        Filters
      </p>
      <FilterPanel {...props} />
    </aside>
  );
}

// ── Mobile drawer ─────────────────────────────────────────────────────────────

interface CatalogFilterDrawerProps extends CatalogFiltersProps {
  open: boolean;
  onClose: () => void;
}

export function CatalogFilterDrawer({
  open,
  onClose,
  ...filterProps
}: CatalogFilterDrawerProps) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Filters"
      side="left"
      width="w-full max-w-xs"
      footer={
        <Button variant="primary" fullWidth onClick={onClose}>
          Show results
        </Button>
      }
    >
      <FilterPanel {...filterProps} />
    </Drawer>
  );
}

// ── Filter section (collapsible) ─────────────────────────────────────────────

interface FilterSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function FilterSection({ title, children, defaultOpen = false }: FilterSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  // Don't render section if no children content
  if (!children) return null;

  return (
    <div className="border-b border-border pb-1 mb-1 last:border-none">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={cn(
          "flex w-full items-center justify-between py-3",
          "text-body-sm font-semibold text-foreground",
          "hover:text-foreground-muted transition-colors",
        )}
      >
        {title}
        <ChevronDown
          className={cn(
            "size-3.5 text-foreground-muted transition-transform duration-200",
            open && "rotate-180",
          )}
          aria-hidden="true"
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ ...transitions.base, opacity: { duration: 0.15 } }}
            className="overflow-hidden"
          >
            <div className="pb-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Filter checkbox ───────────────────────────────────────────────────────────

interface FilterCheckboxProps {
  label: string;
  sublabel?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function FilterCheckbox({ label, sublabel, checked, onChange }: FilterCheckboxProps) {
  return (
    <label
      className={cn(
        "flex items-center gap-2.5 py-1.5 px-1 rounded cursor-pointer",
        "hover:bg-muted transition-colors duration-100 group",
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className={cn(
          "h-4 w-4 rounded border-border",
          "accent-foreground cursor-pointer shrink-0",
        )}
      />
      <span className="text-body-sm text-foreground flex-1 leading-none">
        {label}
      </span>
      {sublabel && (
        <span className="text-caption text-foreground-muted tabular-nums">
          {sublabel}
        </span>
      )}
    </label>
  );
}

// ── Price range ───────────────────────────────────────────────────────────────

interface PriceRangeFilterProps {
  min?: number;
  max?: number;
  onChange: (min: number | undefined, max: number | undefined) => void;
}

function PriceRangeFilter({ min, max, onChange }: PriceRangeFilterProps) {
  const [minVal, setMinVal] = useState(min != null ? String(min) : "");
  const [maxVal, setMaxVal] = useState(max != null ? String(max) : "");

  const apply = () => {
    const minN = minVal !== "" ? parseFloat(minVal) : undefined;
    const maxN = maxVal !== "" ? parseFloat(maxVal) : undefined;
    onChange(
      minN != null && !isNaN(minN) ? minN : undefined,
      maxN != null && !isNaN(maxN) ? maxN : undefined,
    );
  };

  const clear = () => {
    setMinVal("");
    setMaxVal("");
    onChange(undefined, undefined);
  };

  const hasValue = minVal !== "" || maxVal !== "";

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={0}
          placeholder="Min"
          value={minVal}
          onChange={(e) => setMinVal(e.target.value)}
          aria-label="Minimum price"
          className={cn(
            "w-full h-8 rounded-md border border-border bg-surface-elevated",
            "px-2.5 text-body-sm text-foreground placeholder:text-foreground-muted",
            "focus:outline-none focus:border-foreground transition-colors",
          )}
        />
        <span className="text-foreground-muted text-body-sm shrink-0">–</span>
        <input
          type="number"
          min={0}
          placeholder="Max"
          value={maxVal}
          onChange={(e) => setMaxVal(e.target.value)}
          aria-label="Maximum price"
          className={cn(
            "w-full h-8 rounded-md border border-border bg-surface-elevated",
            "px-2.5 text-body-sm text-foreground placeholder:text-foreground-muted",
            "focus:outline-none focus:border-foreground transition-colors",
          )}
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={apply}
          className={cn(
            "flex-1 h-8 rounded-md text-body-sm font-medium",
            "bg-primary text-primary-foreground",
            "hover:bg-primary/85 transition-colors",
          )}
        >
          Apply
        </button>
        {hasValue && (
          <button
            onClick={clear}
            className={cn(
              "h-8 px-3 rounded-md text-body-sm",
              "border border-border text-foreground",
              "hover:bg-muted transition-colors",
            )}
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function FilterSkeleton({ rows }: { rows: number }) {
  return (
    <div className="flex flex-col gap-2 pb-1">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-2.5 py-1">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-3.5 flex-1" />
        </div>
      ))}
    </div>
  );
}
