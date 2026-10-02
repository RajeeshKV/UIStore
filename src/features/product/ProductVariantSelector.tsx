"use client";

import { cn } from "@/lib/utils";
import { normalizeStock } from "@/types/api";
import type { StorefrontVariantResponse, ProductAttributeDto } from "@/types/api";

interface ProductVariantSelectorProps {
  variants: StorefrontVariantResponse[];
  attributes?: ProductAttributeDto[];
  selectedVariantId: string | null;
  onSelect: (variant: StorefrontVariantResponse) => void;
}

export function ProductVariantSelector({ variants, attributes, selectedVariantId, onSelect }: ProductVariantSelectorProps) {
  if (!variants.length) return null;

  const valueLookup = new Map<string, { attrName: string; label: string }>();
  if (attributes) {
    for (const attr of attributes) {
      for (const val of attr.values ?? []) {
        valueLookup.set(val.id, { attrName: attr.name ?? "Option", label: val.value ?? val.id });
      }
    }
  }

  function getVariantAttrs(v: StorefrontVariantResponse): Record<string, string> {
    if (!v.attributeValueIds) return {};
    const ids = v.attributeValueIds.split(",").map((s) => s.trim()).filter(Boolean);
    const result: Record<string, string> = {};
    for (const id of ids) {
      const entry = valueLookup.get(id);
      if (entry) result[entry.attrName] = entry.label;
    }
    return result;
  }

  if (!attributes || attributes.length === 0 || valueLookup.size === 0) {
    return <SimpleVariantList variants={variants} selectedVariantId={selectedVariantId} onSelect={onSelect} />;
  }

  const attrKeys = attributes
    .slice()
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((a) => a.name ?? "Option")
    .filter((v, i, arr) => arr.indexOf(v) === i);

  if (!attrKeys.length) {
    return <SimpleVariantList variants={variants} selectedVariantId={selectedVariantId} onSelect={onSelect} />;
  }

  const selectedVariant  = variants.find((v) => v.id === selectedVariantId) ?? null;
  const selectedAttrs    = selectedVariant ? getVariantAttrs(selectedVariant) : {};

  function handleSelect(attrName: string, valueLabel: string) {
    const desired = { ...selectedAttrs, [attrName]: valueLabel };
    let best = variants.find((v) => {
      const va = getVariantAttrs(v);
      return attrKeys.every((k) => !desired[k] || va[k] === desired[k]);
    });
    if (!best) best = variants.find((v) => getVariantAttrs(v)[attrName] === valueLabel);
    if (best) onSelect(best);
  }

  return (
    <div className="flex flex-col gap-4">
      {attrKeys.map((attrName) => {
        const allValues = [...new Set(variants.map((v) => getVariantAttrs(v)[attrName]).filter(Boolean))];
        if (!allValues.length) return null;

        return (
          <div key={attrName}>
            <p className="text-[13px] font-bold text-[#191c1e] mb-2.5">
              {attrName}
              {selectedAttrs[attrName] && (
                <span className="ml-2 font-normal text-[#444748]">{selectedAttrs[attrName]}</span>
              )}
            </p>
            <div role="group" aria-label={`Select ${attrName}`} className="flex flex-wrap gap-2">
              {allValues.map((val) => {
                const isSelected = selectedAttrs[attrName] === val;
                const candidate = variants.find((v) => {
                  const va = getVariantAttrs(v);
                  return va[attrName] === val && attrKeys.filter((k) => k !== attrName).every((k) => !selectedAttrs[k] || va[k] === selectedAttrs[k]);
                });
                const stock = candidate ? normalizeStock(candidate.stockAvailability) : "OutOfStock";
                const isUnavailable = stock === "OutOfStock" || candidate?.canPurchase === false;

                return (
                  <button
                    key={val}
                    onClick={() => handleSelect(attrName, val)}
                    aria-pressed={isSelected}
                    aria-label={`${attrName}: ${val}${isUnavailable ? " — unavailable" : ""}`}
                    disabled={!candidate}
                    className={cn(
                      "h-10 min-w-10 px-4 rounded-lg border text-[13px] font-semibold relative",
                      "transition-all duration-150",
                      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D0D0D]",
                      isSelected
                        ? "border-[#0D0D0D] bg-[#0D0D0D] text-white shadow-sm"
                        : isUnavailable
                        ? "border-[#E5E7EB] text-[#c4c7c7] bg-[#F4F5F7]"
                        : "border-[#E5E7EB] text-[#191c1e] bg-white hover:border-[#0D0D0D]",
                      !candidate && "opacity-40 cursor-not-allowed",
                    )}
                  >
                    {val}
                    {/* Strikethrough for unavailable */}
                    {isUnavailable && !isSelected && (
                      <span
                        aria-hidden="true"
                        className="absolute inset-x-1 top-1/2 border-t border-[#c4c7c7] rotate-[-12deg] pointer-events-none"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SimpleVariantList({ variants, selectedVariantId, onSelect }: {
  variants: StorefrontVariantResponse[];
  selectedVariantId: string | null;
  onSelect: (v: StorefrontVariantResponse) => void;
}) {
  return (
    <div>
      <p className="text-[13px] font-bold text-[#191c1e] mb-2.5">Option</p>
      <div role="group" aria-label="Select variant" className="flex flex-wrap gap-2">
        {variants.map((v, i) => {
          const isSelected    = v.id === selectedVariantId;
          const stock         = normalizeStock(v.stockAvailability);
          const isUnavailable = stock === "OutOfStock" || !v.canPurchase;
          return (
            <button
              key={v.id}
              onClick={() => onSelect(v)}
              aria-pressed={isSelected}
              aria-label={`Option ${i + 1}${v.sku ? ` (${v.sku})` : ""}${isUnavailable ? " — unavailable" : ""}`}
              disabled={isUnavailable}
              className={cn(
                "h-10 px-4 rounded-lg border text-[13px] font-semibold transition-all duration-150",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D0D0D]",
                isSelected
                  ? "border-[#0D0D0D] bg-[#0D0D0D] text-white"
                  : "border-[#E5E7EB] text-[#191c1e] bg-white hover:border-[#0D0D0D]",
                isUnavailable && "opacity-40 cursor-not-allowed",
              )}
            >
              {v.sku ?? `Option ${i + 1}`}
            </button>
          );
        })}
      </div>
    </div>
  );
}
