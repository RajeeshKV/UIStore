"use client";

import { useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import * as Checkbox from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Drawer } from "@/components/ui/Drawer";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import type { StorefrontCategoryResponse, StorefrontBrandResponse } from "@/types/api";
import type { CatalogParams } from "@/types/catalog";

interface CatalogFiltersProps {
  params: CatalogParams;
  categories: StorefrontCategoryResponse[];
  brands: StorefrontBrandResponse[];
  loading?: boolean;
  onParamChange: (patch: Partial<CatalogParams>) => void;
  onReset: () => void;
}

// ── Shared filter panel ───────────────────────────────────────────────────────

function FilterPanel({ params, categories, brands, loading, onParamChange, onReset }: CatalogFiltersProps) {
  const hasActiveFilters = !!(
    params.CategorySlug || params.BrandSlug || params.InStockOnly ||
    params.MinPrice != null || params.MaxPrice != null
  );

  return (
    <div className="flex flex-col gap-0.5">
      {/* Clear all */}
      {hasActiveFilters && (
        <div className="pb-3 mb-2 border-b border-[#e1e2e4]">
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 text-[13px] text-[#191c1e] font-semibold hover:text-[#444748] transition-colors"
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
                  id={`cat-${cat.id}`}
                  label={cat.name ?? cat.id}
                  sublabel={cat.productCount != null ? String(cat.productCount) : undefined}
                  checked={params.CategorySlug === cat.slug}
                  onChange={(checked) =>
                    onParamChange({ CategorySlug: checked ? cat.slug : undefined, Page: 1 })
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
                  id={`brand-${brand.id}`}
                  label={brand.name ?? brand.id}
                  sublabel={brand.productCount != null ? String(brand.productCount) : undefined}
                  checked={params.BrandSlug === brand.slug}
                  onChange={(checked) =>
                    onParamChange({ BrandSlug: checked ? brand.slug : undefined, Page: 1 })
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </FilterSection>

      {/* Price range */}
      <FilterSection title="Price Range">
        <PriceRangeFilter
          min={params.MinPrice}
          max={params.MaxPrice}
          onChange={(min, max) => onParamChange({ MinPrice: min, MaxPrice: max, Page: 1 })}
        />
      </FilterSection>

      {/* Availability */}
      <FilterSection title="Availability" defaultOpen>
        <FilterCheckbox
          id="in-stock"
          label="In Stock Only"
          checked={!!params.InStockOnly}
          onChange={(checked) => onParamChange({ InStockOnly: checked || undefined, Page: 1 })}
        />
      </FilterSection>
    </div>
  );
}

// ── Desktop sidebar ───────────────────────────────────────────────────────────

export function CatalogFilterSidebar(props: CatalogFiltersProps) {
  return (
    <aside aria-label="Product filters" className="hidden lg:block w-56 shrink-0 pt-2">
      <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#444748] mb-5">
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

export function CatalogFilterDrawer({ open, onClose, ...filterProps }: CatalogFilterDrawerProps) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Filters"
      side="left"
      width="w-full max-w-xs"
      footer={
        <Button variant="primary" fullWidth size="lg" onClick={onClose}>
          Show results
        </Button>
      }
    >
      <FilterPanel {...filterProps} />
    </Drawer>
  );
}

// ── Collapsible filter section ────────────────────────────────────────────────

function FilterSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  if (!children) return null;

  return (
    <div className="border-b border-[#e1e2e4] pb-1 mb-1 last:border-none">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between py-3 text-[13px] font-bold text-[#191c1e] hover:text-[#444748] transition-colors"
      >
        {title}
        <ChevronDown
          className={cn(
            "size-3.5 text-[#444748] transition-transform duration-200",
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
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1], opacity: { duration: 0.15 } }}
            className="overflow-hidden"
          >
            <div className="pb-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Radix-powered filter checkbox ─────────────────────────────────────────────

interface FilterCheckboxProps {
  id: string;
  label: string;
  sublabel?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function FilterCheckbox({ id, label, sublabel, checked, onChange }: FilterCheckboxProps) {
  return (
    <label
      htmlFor={id}
      className="flex items-center gap-2.5 py-1.5 px-1 rounded-lg cursor-pointer hover:bg-[#f3f4f6] transition-colors duration-100 group"
    >
      {/* Radix Checkbox — design: 18×18 rounded-sm, checked=obsidian fill+white check */}
      <Checkbox.Root
        id={id}
        checked={checked}
        onCheckedChange={(v) => onChange(v === true)}
        className={cn(
          "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded",
          "border transition-colors duration-150",
          checked
            ? "bg-[#0D0D0D] border-[#0D0D0D]"
            : "bg-white border-[#D1D5DB] group-hover:border-[#0D0D0D]",
          "focus-visible:outline-2 focus-visible:outline-[#0D0D0D]",
        )}
      >
        <Checkbox.Indicator>
          <Check className="size-3 text-white" aria-hidden="true" strokeWidth={3} />
        </Checkbox.Indicator>
      </Checkbox.Root>

      <span className="text-[13px] text-[#191c1e] flex-1 leading-none">{label}</span>
      {sublabel && (
        <span className="text-[12px] text-[#444748] tabular-nums">{sublabel}</span>
      )}
    </label>
  );
}

// ── Price range ───────────────────────────────────────────────────────────────

function PriceRangeFilter({
  min,
  max,
  onChange,
}: {
  min?: number;
  max?: number;
  onChange: (min: number | undefined, max: number | undefined) => void;
}) {
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

  const inputCls = cn(
    "w-full h-9 rounded-lg border border-[#e1e2e4] bg-[#F4F5F7]",
    "px-2.5 text-[13px] text-[#191c1e] placeholder:text-[#747878]",
    "focus:outline-none focus:bg-white focus:border-[#0D0D0D]/40 focus:ring-1 focus:ring-[#0D0D0D]/10",
    "transition-colors",
  );

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2">
        <input type="number" min={0} placeholder="Min" value={minVal} onChange={(e) => setMinVal(e.target.value)} aria-label="Minimum price" className={inputCls} />
        <span className="text-[#444748] text-[13px] shrink-0">–</span>
        <input type="number" min={0} placeholder="Max" value={maxVal} onChange={(e) => setMaxVal(e.target.value)} aria-label="Maximum price" className={inputCls} />
      </div>
      <div className="flex gap-2">
        <button
          onClick={apply}
          className="flex-1 h-9 rounded-lg text-[13px] font-bold bg-[#0D0D0D] text-white hover:bg-[#262626] transition-colors"
        >
          Apply
        </button>
        {hasValue && (
          <button
            onClick={clear}
            className="h-9 px-3 rounded-lg text-[13px] border border-[#e1e2e4] text-[#191c1e] hover:bg-[#f3f4f6] transition-colors"
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
          <Skeleton className="h-[18px] w-[18px] rounded" />
          <Skeleton className="h-3.5 flex-1" />
        </div>
      ))}
    </div>
  );
}
