"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { StorefrontVariantResponse, ProductAttributeDto } from "@/types/api";

interface ProductVariantSelectorProps {
  variants: StorefrontVariantResponse[];
  attributes?: ProductAttributeDto[];
  selectedVariantId: string | null;
  onSelect: (variant: StorefrontVariantResponse) => void;
}

// ── Core matching logic (§6 of the guide) ─────────────────────────────────────

function parseIds(csv: string | null | undefined): string[] {
  if (!csv) return [];
  return csv.split(",").map((s) => s.trim()).filter(Boolean);
}

/**
 * Finds the variant whose attribute-value set exactly matches the selection.
 * Order-independent set equality.
 */
function findVariant(
  variants: StorefrontVariantResponse[],
  selected: Record<string, string>, // axisId → valueId
): StorefrontVariantResponse | undefined {
  const wanted = Object.values(selected).sort();
  return variants.find((v) => {
    if (!v) return false;
    const ids = parseIds(v.attributeValueIds).sort();
    return ids.length === wanted.length && ids.every((id, i) => id === wanted[i]);
  });
}

/**
 * Returns true if `valueId` is reachable given the rest of the current selection.
 * A value is available when some purchasable variant contains it AND, for every
 * OTHER axis already chosen, that variant agrees with the choice.
 */
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
    // Check all OTHER axes that have a current selection agree
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
}: ProductVariantSelectorProps) {
  // Guard: filter out any null/undefined entries the API might return
  const safeVariants = variants.filter(Boolean) as StorefrontVariantResponse[];

  // selection: axisId → valueId
  const [selection, setSelection] = useState<Record<string, string>>(() => {
    // Pre-select from the initial selectedVariantId if given
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

  // No attributes configured → simple fallback list
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

    // Resolve variant if all axes are selected
    if (Object.keys(next).length === sortedAxes.length) {
      const v = findVariant(safeVariants, next);
      if (v) onSelect(v);
    }
  }

  // Current resolved variant (may be undefined if selection is partial)
  const resolved = Object.keys(selection).length === sortedAxes.length
    ? findVariant(safeVariants, selection)
    : undefined;

  // Sync: if the parent changed selectedVariantId externally, also highlight
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
            <p className="text-[13px] font-bold text-[#191c1e] mb-2.5">
              {axis.name}
              {selectedValueId && (() => {
                const label = sortedValues.find((v) => v.id === selectedValueId)?.value;
                return label ? (
                  <span className="ml-2 font-normal text-[#444748]">{label}</span>
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
                      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D0D0D]",
                      isSelected
                        ? "border-[#0D0D0D] bg-[#0D0D0D] text-white shadow-sm"
                        : available
                        ? "border-[#E5E7EB] text-[#191c1e] bg-white hover:border-[#0D0D0D]"
                        : "border-[#E5E7EB] text-[#c4c7c7] bg-[#F4F5F7] cursor-pointer",
                    )}
                  >
                    {val.value}
                    {/* Diagonal strikethrough for unavailable (not selected) */}
                    {!available && !isSelected && (
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

      {/* Show selected variant SKU for reference */}
      {activeVariantId && (() => {
        const v = safeVariants.find((v) => v.id === activeVariantId);
        return v?.sku ? (
          <p className="text-[11px] text-[#5A6578]">SKU: {v.sku}</p>
        ) : null;
      })()}
    </div>
  );
}

// ── Fallback: no attribute axes configured ─────────────────────────────────────

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
      <p className="text-[13px] font-bold text-[#191c1e] mb-2.5">Option</p>
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
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D0D0D]",
                isSelected
                  ? "border-[#0D0D0D] bg-[#0D0D0D] text-white"
                  : isUnavailable
                  ? "border-[#E5E7EB] text-[#c4c7c7] bg-[#F4F5F7]"
                  : "border-[#E5E7EB] text-[#191c1e] bg-white hover:border-[#0D0D0D]",
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
