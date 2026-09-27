"use client";

import { cn } from "@/lib/utils";
import { normalizeStock } from "@/types/api";
import type { StorefrontVariantResponse, ProductAttributeDto } from "@/types/api";

interface ProductVariantSelectorProps {
  variants: StorefrontVariantResponse[];
  /** Product-level attributes with their values (from StorefrontProductResponse.attributes) */
  attributes?: ProductAttributeDto[];
  selectedVariantId: string | null;
  onSelect: (variant: StorefrontVariantResponse) => void;
}

/**
 * Renders variant selectors derived from backend attribute data.
 *
 * The actual API returns variants with `attributeValueIds` (comma-separated UUIDs)
 * and product-level `attributes` containing the full value definitions.
 * We cross-reference to build a human-readable selector.
 *
 * If attribute data is not available (older API response), falls back to
 * simple variant list by index.
 */
export function ProductVariantSelector({
  variants,
  attributes,
  selectedVariantId,
  onSelect,
}: ProductVariantSelectorProps) {
  if (!variants.length) return null;

  // Build a lookup: valueId → { attributeName, valueLabel }
  const valueLookup = new Map<string, { attrName: string; label: string }>();
  if (attributes) {
    for (const attr of attributes) {
      for (const val of attr.values ?? []) {
        valueLookup.set(val.id, {
          attrName: attr.name ?? "Option",
          label: val.value ?? val.id,
        });
      }
    }
  }

  // Build per-variant attribute map: variantId → Record<attrName, valueLabel>
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

  // If we have no attribute definitions, fall back to simple index-based selector
  if (!attributes || attributes.length === 0 || valueLookup.size === 0) {
    return <SimpleVariantList variants={variants} selectedVariantId={selectedVariantId} onSelect={onSelect} />;
  }

  // Collect attribute keys in attribute sortOrder
  const attrKeys = attributes
    .slice()
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((a) => a.name ?? "Option")
    .filter((v, i, arr) => arr.indexOf(v) === i);

  if (!attrKeys.length) {
    return <SimpleVariantList variants={variants} selectedVariantId={selectedVariantId} onSelect={onSelect} />;
  }

  const selectedVariant = variants.find((v) => v.id === selectedVariantId) ?? null;
  const selectedAttrs = selectedVariant ? getVariantAttrs(selectedVariant) : {};

  function handleSelect(attrName: string, valueLabel: string) {
    const desired = { ...selectedAttrs, [attrName]: valueLabel };
    // Find best-matching variant
    let best = variants.find((v) => {
      const va = getVariantAttrs(v);
      return attrKeys.every((k) => !desired[k] || va[k] === desired[k]);
    });
    if (!best) {
      best = variants.find((v) => getVariantAttrs(v)[attrName] === valueLabel);
    }
    if (best) onSelect(best);
  }

  return (
    <div className="flex flex-col gap-4">
      {attrKeys.map((attrName) => {
        const allValues = [
          ...new Set(
            variants
              .map((v) => getVariantAttrs(v)[attrName])
              .filter(Boolean),
          ),
        ];

        if (!allValues.length) return null;

        return (
          <div key={attrName}>
            <p className="text-label font-semibold text-foreground mb-2">
              {attrName}
              {selectedAttrs[attrName] && (
                <span className="ml-2 font-normal text-foreground-muted">
                  {selectedAttrs[attrName]}
                </span>
              )}
            </p>
            <div role="group" aria-label={`Select ${attrName}`} className="flex flex-wrap gap-2">
              {allValues.map((val) => {
                const isSelected = selectedAttrs[attrName] === val;
                const candidate = variants.find((v) => {
                  const va = getVariantAttrs(v);
                  return (
                    va[attrName] === val &&
                    attrKeys
                      .filter((k) => k !== attrName)
                      .every((k) => !selectedAttrs[k] || va[k] === selectedAttrs[k])
                  );
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
                      "h-9 min-w-9 px-3 rounded-md border text-body-sm font-medium relative",
                      "transition-colors duration-150",
                      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
                      isSelected
                        ? "border-foreground bg-foreground text-primary-foreground"
                        : isUnavailable
                        ? "border-border text-foreground-muted"
                        : "border-border text-foreground hover:border-foreground-muted",
                      !candidate && "opacity-40 cursor-not-allowed",
                    )}
                  >
                    {val}
                    {isUnavailable && !isSelected && (
                      <span
                        aria-hidden="true"
                        className="absolute inset-x-1 top-1/2 border-t border-foreground-muted/60 rotate-[-12deg] pointer-events-none"
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

function SimpleVariantList({
  variants,
  selectedVariantId,
  onSelect,
}: {
  variants: StorefrontVariantResponse[];
  selectedVariantId: string | null;
  onSelect: (v: StorefrontVariantResponse) => void;
}) {
  return (
    <div>
      <p className="text-label font-semibold text-foreground mb-2">Option</p>
      <div role="group" aria-label="Select variant" className="flex flex-wrap gap-2">
        {variants.map((v, i) => {
          const isSelected = v.id === selectedVariantId;
          const stock = normalizeStock(v.stockAvailability);
          const isUnavailable = stock === "OutOfStock" || !v.canPurchase;
          return (
            <button
              key={v.id}
              onClick={() => onSelect(v)}
              aria-pressed={isSelected}
              aria-label={`Option ${i + 1}${v.sku ? ` (${v.sku})` : ""}${isUnavailable ? " — unavailable" : ""}`}
              disabled={isUnavailable}
              className={cn(
                "h-9 px-3 rounded-md border text-body-sm font-medium transition-colors",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
                isSelected
                  ? "border-foreground bg-foreground text-primary-foreground"
                  : "border-border text-foreground hover:border-foreground-muted",
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
