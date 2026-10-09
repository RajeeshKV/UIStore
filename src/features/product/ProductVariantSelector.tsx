"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { StorefrontVariantResponse, ProductAttributeDto } from "@/types/api";

interface ProductVariantSelectorProps {
  variants: StorefrontVariantResponse[];
  attributes?: ProductAttributeDto[];
  selectedVariantId: string | null;
  onSelect: (variant: StorefrontVariantResponse) => void;
  onPartialSelect?: () => void;
}

// ── Core matching logic ────────────────────────────────────────────────────────

function parseIds(csv: string | null | undefined): string[] {
  if (!csv) return [];
  return csv.split(",").map((s) => s.trim()).filter(Boolean);
}

function findVariant(
  variants: StorefrontVariantResponse[],
  selected: Record<string, string>,
): StorefrontVariantResponse | undefined {
  const wanted = Object.values(selected).sort();
  return variants.find((v) => {
    if (!v) return false;
    const ids = parseIds(v.attributeValueIds).sort();
    return ids.length === wanted.length && ids.every((id, i) => id === wanted[i]);
  });
}

function isValueAvailable(
  variants: StorefrontVariantResponse[],
  selected: Record<string, string>,
  axisId: string,
  valueId: string,
): boolean {
  return variants.some((v) => {
    if (!v) return false;
    const ids = parseIds(v.attributeValueIds);
    if (!ids.includes(valueId) || !v.canPurchase) return false;
    return Object.entries(selected)
      .filter(([sid]) => sid !== axisId)
      .every(([, id]) => ids.includes(id));
  });
}

// ── Main component ─────────────────────────────────────────────────────────────

export function ProductVariantSelector({
  variants,
  attributes,
  selectedVariantId,
  onSelect,
  onPartialSelect,
}: ProductVariantSelectorProps) {
  const safeVariants = variants.filter(Boolean) as StorefrontVariantResponse[];

  const [selection, setSelection] = useState<Record<string, string>>(() => {
    const initial = safeVariants.find((v) => v.id === selectedVariantId);
    if (!initial || !attributes) return {};
    const ids = parseIds(initial.attributeValueIds);
    const sel: Record<string, string> = {};
    for (const attr of attributes) {
      const match = attr.values?.find((val) => ids.includes(val.id));
      if (match) sel[attr.id] = match.id;
    }
    return sel;
  });

  if (!safeVariants.length) return null;

  if (!attributes || attributes.length === 0) {
    return (
      <SimpleVariantList
        variants={safeVariants}
        selectedVariantId={selectedVariantId}
        onSelect={onSelect}
      />
    );
  }

  const sortedAxes = attributes
    .slice()
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  function handleSelect(axisId: string, valueId: string) {
    const next = { ...selection, [axisId]: valueId };
    setSelection(next);

    if (Object.keys(next).length === sortedAxes.length) {
      const v = findVariant(safeVariants, next);
      if (v) {
        onSelect(v);
      } else {
        onPartialSelect?.();
      }
    } else {
      onPartialSelect?.();
    }
  }

  const resolved = Object.keys(selection).length === sortedAxes.length
    ? findVariant(safeVariants, selection)
    : undefined;

  const activeVariantId = resolved?.id ?? selectedVariantId;

  return (
    <div className="flex flex-col gap-4">
      {sortedAxes.map((axis) => {
        const sortedValues = (axis.values ?? [])
          .slice()
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

        if (!sortedValues.length) return null;

        const selectedValueId = selection[axis.id];

        return (
          <div key={axis.id}>
            <p className="text-[13px] font-bold text-foreground mb-2.5">
              {axis.name}
              {selectedValueId && (() => {
                const label = sortedValues.find((v) => v.id === selectedValueId)?.value;
                return label ? (
                  <span className="ml-2 font-normal text-foreground-muted">{label}</span>
                ) : null;
              })()}
            </p>

            <div role="group" aria-label={`Select ${axis.name}`} className="flex flex-wrap gap-2">
              {sortedValues.map((val) => {
                const isSelected = selectedValueId === val.id;
                const available = isValueAvailable(safeVariants, selection, axis.id, val.id ?? "");

                return (
                  <button
                    key={val.id}
                    type="button"
                    onClick={() => handleSelect(axis.id, val.id)}
                    aria-pressed={isSelected}
                    aria-label={`${axis.name}: ${val.value}${!available ? " — unavailable" : ""}`}
                    className={cn(
                      "h-10 min-w-10 px-4 rounded-lg border text-[13px] font-semibold relative",
                      "transition-all duration-150",
                      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : available
                        ? "border-border text-foreground bg-surface-elevated hover:border-primary"
                        : "border-border text-border-strong bg-surface-container cursor-pointer",
                    )}
                  >
                    {val.value}
                    {!available && !isSelected && (
                      <span
                        aria-hidden="true"
                        className="absolute inset-x-1 top-1/2 border-t border-border-strong rotate-[-12deg] pointer-events-none"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {activeVariantId && (() => {
        const v = safeVariants.find((v) => v.id === activeVariantId);
        return v?.sku ? (
          <p className="text-[11px] text-foreground-muted">SKU: {v.sku}</p>
        ) : null;
      })()}
    </div>
  );
}

// ── Fallback: no attribute axes configured ────────────────────────────────────

function SimpleVariantList({
  variants,
  selectedVariantId,
  onSelect,
}: {
  variants: StorefrontVariantResponse[];
  selectedVariantId: string | null;
  onSelect: (v: StorefrontVariantResponse) => void;
}) {
  const safeVariants = variants.filter(Boolean) as StorefrontVariantResponse[];
  return (
    <div>
      <p className="text-[13px] font-bold text-foreground mb-2.5">Option</p>
      <div role="group" aria-label="Select variant" className="flex flex-wrap gap-2">
        {safeVariants.map((v, i) => {
          const isSelected = v.id === selectedVariantId;
          const isUnavailable = !v.canPurchase;
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => onSelect(v)}
              aria-pressed={isSelected}
              aria-label={`Option ${i + 1}${v.sku ? ` (${v.sku})` : ""}${isUnavailable ? " — unavailable" : ""}`}
              className={cn(
                "h-10 px-4 rounded-lg border text-[13px] font-semibold transition-all duration-150",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                isSelected
                  ? "border-primary bg-primary text-primary-foreground"
                  : isUnavailable
                  ? "border-border text-border-strong bg-surface-container"
                  : "border-border text-foreground bg-surface-elevated hover:border-primary",
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
