"use client";

/**
 * ProductForm — variant-aware product editor.
 *
 * Three-button toolbar: Cancel · Publish · Save
 * - Cancel: reloads from server, discards all local edits
 * - Publish: POST /api/v1/products/{id}/publish (independent state transition)
 * - Save: orchestrates ALL dirty sections in parallel; all-or-nothing rollback on failure
 *
 * Dirty tracking:
 *   basicInfo  — any top-form field changed
 *   attributes — any axis name/value edited (sends one PUT per dirty axis)
 *   variants   — per variant: sku / priceOverride / isActive / onHand / lowStockThreshold
 *
 * No per-row or per-axis Save buttons.
 */

import { useState, useCallback, useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Plus, X, GripVertical, Zap, AlertTriangle, ChevronDown, ChevronUp, Check, RotateCcw } from "lucide-react";
import {
  adminProductsApi,
  adminVariantsApi,
  adminAttributesApi,
  adminInventoryApi,
} from "@/services/api/admin";
import { VariantImageManager } from "./VariantImageManager";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/features/admin/AdminDialog";
import { AdminStatusBadge } from "@/features/admin/AdminStatusBadge";
import { formatPrice, cn, extractApiError } from "@/lib/utils";
import type {
  ProductResponse,
  CreateProductRequest,
  CategoryResponse,
  BrandResponse,
  VariantResponse,
  ProductAttributeItem,
  ProductAttributeValueItem,
  InventoryResponse,
} from "@/types/api";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseIds(csv: string | null | undefined): string[] {
  if (!csv) return [];
  return csv.split(",").map((s) => s.trim()).filter(Boolean);
}

function variantsUsingValue(variants: VariantRowState[], valueId: string): number {
  return variants.filter((v) => parseIds(v.attributeValueIds).includes(valueId)).length;
}

function canonical(ids: string[]): string {
  return [...ids].sort().join(",");
}

function* cartesian<T>(axes: T[][]): Generator<T[]> {
  if (axes.length === 0) { yield []; return; }
  const [head, ...rest] = axes;
  for (const h of head) for (const tail of cartesian(rest)) yield [h, ...tail];
}

// ─────────────────────────────────────────────────────────────────────────────
// Section card wrappers
// ─────────────────────────────────────────────────────────────────────────────

function Card({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-lg border border-border bg-background p-4 flex flex-col gap-3", className)}>
      <h3 className="text-body-sm font-semibold text-foreground border-b border-border pb-2">{title}</h3>
      {children}
    </div>
  );
}

function CardFlush({ title, description, children }: { title: string; description?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-background flex flex-col min-w-0">
      <div className="px-4 pt-4 pb-3 border-b border-border flex flex-col gap-1">
        <h3 className="text-body-sm font-semibold text-foreground">{title}</h3>
        {description && <p className="text-caption text-foreground-muted">{description}</p>}
      </div>
      <div className="flex flex-col gap-0">{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// StockBadge — inline stock state for variant rows
// ─────────────────────────────────────────────────────────────────────────────

function StockBadge({ inv }: { inv: VariantRowState }) {
  if (inv.isOutOfStock)
    return (
      <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold bg-danger/10 text-danger">
        Out of stock
      </span>
    );
  if (inv.isLowStock)
    return (
      <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold bg-warning/15 text-warning">
        Low stock
      </span>
    );
  return (
    <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold bg-success/10 text-success">
      In stock
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Product-level image manager (only shown when product has NO variants)
// ─────────────────────────────────────────────────────────────────────────────

interface ImageManagerProps {
  productId: string;
  images: ProductResponse["images"];
  onRefresh: () => void;
}

function ImageManager({ productId, images = [], onRefresh }: ImageManagerProps) {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [settingPrimary, setSettingPrimary] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function uploadFiles(files: FileList | File[]) {
    const fileArr = Array.from(files).filter((f) => f.type.startsWith("image/")).slice(0, 10);
    if (fileArr.length === 0) { setError("Please select image files (max 10)."); return; }
    setError("");
    setUploading(true);
    const formData = new FormData();
    fileArr.forEach((f) => formData.append("files", f));
    const res = await adminProductsApi.addImages(productId, formData);
    setUploading(false);
    if (res.ok) onRefresh();
    else setError(extractApiError(res.error, "Upload failed."));
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.length) await uploadFiles(e.target.files);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    await uploadFiles(Array.from(e.dataTransfer.files));
  }

  async function handleSetPrimary(imageId: string) {
    setSettingPrimary(imageId);
    const res = await adminProductsApi.setPrimaryImage(productId, imageId);
    setSettingPrimary(null);
    if (res.ok) onRefresh();
    else setError(extractApiError(res.error, "Failed."));
  }

  async function handleDelete(imageId: string) {
    setDeleting(imageId);
    const res = await adminProductsApi.deleteImage(productId, imageId);
    setDeleting(null);
    if (res.ok) onRefresh();
    else setError(extractApiError(res.error, "Failed."));
  }

  return (
    <div className="flex flex-col gap-3">
      {error && <p className="text-caption text-danger">{error}</p>}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((img) => (
            <div key={img.id} className="relative group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.asset?.secureUrl ?? ""}
                alt={img.asset?.altText ?? "Product image"}
                className="h-16 w-16 rounded-lg object-cover bg-surface border border-border"
              />
              {img.isPrimary ? (
                <span className="absolute bottom-0.5 left-0.5 text-[8px] font-bold bg-primary text-primary-foreground rounded px-1 pointer-events-none">
                  Primary
                </span>
              ) : (
                <button
                  aria-label="Set primary"
                  onClick={() => handleSetPrimary(img.id)}
                  disabled={settingPrimary === img.id}
                  className="absolute bottom-0.5 left-0.5 hidden group-hover:flex text-[8px] font-medium bg-background/90 text-foreground rounded px-1 border border-border hover:bg-primary hover:text-primary-foreground"
                >
                  {settingPrimary === img.id ? "…" : "Primary"}
                </button>
              )}
              <button
                aria-label="Delete image"
                onClick={() => handleDelete(img.id)}
                disabled={deleting === img.id}
                className="absolute -top-1 -right-1 hidden group-hover:flex h-4 w-4 items-center justify-center rounded-full bg-danger text-white"
              >
                {deleting === img.id ? <span className="text-[7px]">…</span> : <X className="size-2" />}
              </button>
            </div>
          ))}
        </div>
      )}
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload images"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "flex items-center justify-center gap-2 rounded-lg border-2 border-dashed cursor-pointer py-4 transition-colors",
          isDragging ? "border-primary bg-primary/5" : "border-border hover:border-border-strong hover:bg-muted/30",
          uploading && "opacity-50 pointer-events-none",
        )}
      >
        <input ref={inputRef} type="file" accept="image/*" multiple aria-label="Image files" onChange={handleFileChange} className="sr-only" />
        {uploading
          ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          : <Plus className="size-4 text-foreground-muted" aria-hidden="true" />}
        <p className="text-body-sm text-foreground-muted">
          {uploading ? "Uploading…" : <><span className="font-medium text-foreground">Click</span> or drag & drop · max 10</>}
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Product-level stock manager (only shown when product has NO variants)
// ─────────────────────────────────────────────────────────────────────────────

function StockManager({ productId }: { productId: string }) {
  const [inventory, setInventory] = useState<InventoryResponse | null>(null);
  const [onHand, setOnHand] = useState("");
  const [lowStockThreshold, setLowStockThreshold] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function applyInventory(inv: InventoryResponse) {
    setInventory(inv);
    setOnHand(String(inv.onHand));
    setLowStockThreshold(String(inv.lowStockThreshold));
  }

  async function handleSet() {
    const parsed = parseInt(onHand);
    if (isNaN(parsed) || parsed < 0) { setError("On-hand must be a non-negative integer."); return; }
    setError(""); setSuccess(""); setSaving(true);
    const threshold = lowStockThreshold.trim() !== "" ? parseInt(lowStockThreshold) : undefined;
    const res = await adminInventoryApi.set(productId, { onHand: parsed, lowStockThreshold: threshold });
    setSaving(false);
    if (res.ok) {
      applyInventory(res.data);
      setSuccess("Stock updated.");
      setTimeout(() => setSuccess(""), 3000);
    } else {
      setError(extractApiError(res.error, "Failed to set stock."));
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {inventory ? (
        <div className="flex flex-wrap items-center gap-3 text-caption text-foreground-muted rounded-lg bg-surface border border-border px-3 py-2.5">
          {inventory.isOutOfStock
            ? <span className="text-[10px] font-semibold text-danger">Out of stock</span>
            : inventory.isLowStock
              ? <span className="text-[10px] font-semibold text-warning">Low stock</span>
              : <span className="text-[10px] font-semibold text-success">In stock</span>}
          <span>On hand: <strong className="text-foreground">{inventory.onHand}</strong></span>
          <span>Reserved: <strong className="text-foreground">{inventory.reserved}</strong></span>
          <span>Available: <strong className="text-foreground">{inventory.available}</strong></span>
        </div>
      ) : (
        <p className="text-caption text-foreground-muted">No inventory record yet.</p>
      )}
      {error && <p className="text-caption text-danger">{error}</p>}
      {success && <p className="text-caption text-success">{success}</p>}
      <div className="grid grid-cols-2 gap-3">
        <Input label="On hand (absolute)" type="number" min={0} value={onHand} onChange={(e) => setOnHand(e.target.value)} placeholder="e.g. 100" hint="Replaces current quantity." />
        <Input label="Low-stock threshold" type="number" min={0} value={lowStockThreshold} onChange={(e) => setLowStockThreshold(e.target.value)} placeholder="e.g. 10" />
      </div>
      <Button type="button" variant="outline" size="sm" onClick={handleSet} loading={saving} className="self-start">Set stock</Button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Attribute axis card
// No per-axis Save button. Edits accumulate locally.
// Parent calls axisRef.getSavePayload() during top-level Save.
// ─────────────────────────────────────────────────────────────────────────────

type EditValue = { id?: string; value: string; _key: string };

export interface AttributeAxisHandle {
  id: string;
  isDirty: () => boolean;
  getSavePayload: () => { name: string; values: Array<{ value: string; id?: string }> } | null;
  markClean: () => void;
}

interface AttributeAxisCardProps {
  attr: ProductAttributeItem;
  variants: VariantRowState[];
  onDeleteAxis: (attr: ProductAttributeItem) => void;
  onDirtyChange: (attrId: string, dirty: boolean) => void;
}

const AttributeAxisCard = forwardRef<AttributeAxisHandle, AttributeAxisCardProps>(
  function AttributeAxisCard({ attr, variants, onDeleteAxis, onDirtyChange }, ref) {
    const [expanded, setExpanded] = useState(true);
    const [editValues, setEditValues] = useState<EditValue[]>(() =>
      attr.values.slice().sort((a, b) => a.sortOrder - b.sortOrder).map((v) => ({ id: v.id, value: v.value, _key: v.id }))
    );
    const [attrName, setAttrName] = useState(attr.name);
    const [error, setError] = useState("");
    const [dirty, setDirty] = useState(false);
    const [dragOver, setDragOver] = useState<number | null>(null);
    const dragIdx = useRef<number | null>(null);

    const removedValues = attr.values.filter((v) => !editValues.some((ev) => ev.id === v.id));
    const affectedVariantCount = removedValues.reduce((acc, v) => acc + variantsUsingValue(variants, v.id), 0);

    function markDirty() {
      setDirty(true);
      onDirtyChange(attr.id, true);
    }

    useImperativeHandle(ref, () => ({
      id: attr.id,
      isDirty: () => dirty,
      getSavePayload: () => {
        if (!attrName.trim()) { setError("Axis name is required."); return null; }
        const cleanValues = editValues.filter((v) => v.value.trim());
        if (cleanValues.length === 0) { setError("At least one value is required."); return null; }
        return {
          name: attrName.trim(),
          values: cleanValues.map((v) => ({ value: v.value.trim(), ...(v.id ? { id: v.id } : {}) })),
        };
      },
      markClean: () => {
        setDirty(false);
        setError("");
        onDirtyChange(attr.id, false);
      },
    }));

    function addValue() { setEditValues((p) => [...p, { value: "", _key: crypto.randomUUID() }]); markDirty(); }
    function removeValue(key: string) { setEditValues((p) => p.filter((v) => v._key !== key)); markDirty(); }
    function updateValue(key: string, val: string) {
      setEditValues((p) => p.map((v) => v._key === key ? { ...v, value: val } : v));
      markDirty();
    }
    function handleNameChange(n: string) { setAttrName(n); markDirty(); }

    function handleDragStart(idx: number) { dragIdx.current = idx; }
    function handleDragEnter(idx: number) { setDragOver(idx); }
    function handleDragEnd() {
      if (dragIdx.current === null || dragOver === null || dragIdx.current === dragOver) {
        dragIdx.current = null; setDragOver(null); return;
      }
      const next = [...editValues];
      const [item] = next.splice(dragIdx.current, 1);
      next.splice(dragOver, 0, item);
      setEditValues(next);
      dragIdx.current = null; setDragOver(null);
      markDirty();
    }

    return (
      <div className={cn("rounded-lg border bg-surface overflow-hidden", dirty ? "border-warning/50" : "border-border")}>
        <div className="flex items-center gap-2 px-3 py-2.5 bg-surface">
          <button type="button" onClick={() => setExpanded((v) => !v)} aria-label={expanded ? "Collapse" : "Expand"} className="h-5 w-5 flex items-center justify-center text-foreground-muted hover:text-foreground shrink-0">
            {expanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          </button>
          <input
            value={attrName}
            onChange={(e) => handleNameChange(e.target.value)}
            aria-label="Axis name"
            className="flex-1 min-w-0 text-body-sm font-semibold text-foreground bg-transparent focus:outline-none focus:ring-1 focus:ring-focus rounded px-1"
          />
          {dirty && <span className="text-[10px] text-warning font-medium shrink-0">unsaved</span>}
          <button type="button" aria-label={`Delete ${attr.name} axis`} onClick={() => onDeleteAxis(attr)} className="h-6 w-6 flex items-center justify-center rounded text-foreground-muted hover:bg-danger/10 hover:text-danger">
            <Trash2 className="size-3" />
          </button>
        </div>

        {expanded && (
          <div className="border-t border-border px-3 py-2.5 flex flex-col gap-2">
            {error && <p className="text-caption text-danger">{error}</p>}

            {affectedVariantCount > 0 && (
              <div className="flex items-start gap-2 rounded-md bg-warning/10 border border-warning/30 px-2.5 py-2">
                <AlertTriangle className="size-3.5 text-warning mt-0.5 shrink-0" aria-hidden="true" />
                <p className="text-caption text-warning">
                  Saving will remove {removedValues.length} value{removedValues.length !== 1 ? "s" : ""} used by {affectedVariantCount} variant{affectedVariantCount !== 1 ? "s" : ""}. Those variants will lose this dimension.
                </p>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              {editValues.map((ev, idx) => (
                <div
                  key={ev._key}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragEnter={() => handleDragEnter(idx)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => e.preventDefault()}
                  className={cn("flex items-center gap-1.5 rounded", dragOver === idx && "ring-1 ring-primary bg-primary/5")}
                >
                  <GripVertical className="size-3.5 text-foreground-muted cursor-grab shrink-0" aria-hidden="true" />
                  <input
                    value={ev.value}
                    onChange={(e) => updateValue(ev._key, e.target.value)}
                    placeholder="e.g. Red"
                    aria-label={`Value ${idx + 1}`}
                    className="flex-1 h-8 px-2.5 rounded border border-border bg-background text-body-sm text-foreground focus:outline-none focus:ring-1 focus:ring-focus"
                  />
                  <button
                    type="button"
                    aria-label="Remove value"
                    onClick={() => removeValue(ev._key)}
                    disabled={editValues.length <= 1}
                    className="h-8 w-8 flex items-center justify-center rounded text-foreground-muted hover:text-danger disabled:opacity-30"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <button type="button" onClick={addValue} className="flex items-center gap-1 text-caption text-foreground-muted hover:text-foreground self-start">
              <Plus className="size-3" /> Add value
            </button>
            <p className="text-[10px] text-foreground-muted">
              {editValues.filter((v) => v.value.trim()).length} value{editValues.filter((v) => v.value.trim()).length !== 1 ? "s" : ""} · drag rows to reorder
            </p>
          </div>
        )}
      </div>
    );
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// Attribute editor
// Manages the list of axes. "Add Axis" still calls API immediately (creates the
// axis on the backend) so variants can be generated against it right away.
// Axis edits are deferred to top-level Save.
// ─────────────────────────────────────────────────────────────────────────────

interface AttributeEditorProps {
  productId: string;
  variants: VariantRowState[];
  attributes: ProductAttributeItem[];
  axisRefs: React.MutableRefObject<Map<string, AttributeAxisHandle>>;
  onAttributesChange: (attrs: ProductAttributeItem[]) => void;
  onAxisDirtyChange: (attrId: string, dirty: boolean) => void;
  onRefreshVariants: () => void;
}

function AttributeEditor({
  productId,
  variants,
  attributes,
  axisRefs,
  onAttributesChange,
  onAxisDirtyChange,
  onRefreshVariants,
}: AttributeEditorProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [newName, setNewName] = useState("");
  const [addingNew, setAddingNew] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProductAttributeItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Register a ref for each axis card so top-level Save can call getSavePayload()
  function setAxisRef(id: string, handle: AttributeAxisHandle | null) {
    if (handle) axisRefs.current.set(id, handle);
    else axisRefs.current.delete(id);
  }

  async function handleAddAxis() {
    if (!newName.trim()) return;
    setLoading(true);
    const res = await adminAttributesApi.upsert(productId, { name: newName.trim(), values: [{ value: "Value 1" }] });
    setLoading(false);
    if (res.ok) {
      onAttributesChange(res.data.attributes);
      setNewName("");
      setAddingNew(false);
      onRefreshVariants();
    }
  }

  async function handleDeleteAxis() {
    if (!deleteTarget) return;
    setDeleting(true);
    await adminAttributesApi.delete(productId, deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
    const res = await adminAttributesApi.get(productId);
    if (res.ok) {
      onAttributesChange(res.data.attributes);
      onRefreshVariants();
    }
  }

  if (loading) return <p className="text-caption text-foreground-muted">Loading…</p>;
  if (error) return <p className="text-caption text-danger">{error}</p>;

  return (
    <div className="flex flex-col gap-2">
      {attributes.length === 0 && !addingNew && (
        <p className="text-caption text-foreground-muted">No axes yet. Add one to enable variants.</p>
      )}

      {attributes.map((attr) => (
        <AttributeAxisCard
          key={attr.id}
          ref={(handle) => setAxisRef(attr.id, handle)}
          attr={attr}
          variants={variants}
          onDeleteAxis={setDeleteTarget}
          onDirtyChange={onAxisDirtyChange}
        />
      ))}

      {addingNew ? (
        <div className="flex gap-2 items-center">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleAddAxis();
              if (e.key === "Escape") { setAddingNew(false); setNewName(""); }
            }}
            placeholder="Axis name, e.g. Colour"
            aria-label="New attribute axis name"
            className="flex-1 h-9 px-3 rounded-md border border-border bg-background text-body-sm text-foreground focus:outline-none focus:ring-2 focus:ring-focus"
          />
          <Button type="button" variant="primary" size="sm" onClick={handleAddAxis} disabled={!newName.trim()}>Add</Button>
          <Button type="button" variant="outline" size="sm" onClick={() => { setAddingNew(false); setNewName(""); }}>Cancel</Button>
        </div>
      ) : (
        <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => setAddingNew(true)}>
          <Plus className="size-3.5 mr-1" /> Add Axis
        </Button>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteAxis}
        title="Delete axis"
        description={`Delete "${deleteTarget?.name}" and all its values? Variants referencing these will lose this dimension.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        loading={deleting}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Variant row state — lifted into the VariantEditor, merged after save
// ─────────────────────────────────────────────────────────────────────────────

interface VariantRowState {
  // Identity
  id: string;
  attributeValueIds: string | undefined;
  attributes: VariantResponse["attributes"];
  images: VariantResponse["images"];
  // Editable fields
  sku: string;
  priceOverride: string; // string for input binding; "" = inherit
  isActive: boolean;
  sortOrder: number;
  // Stock editable fields
  onHand: string;
  lowStockThreshold: string;
  // Stock display (from InventoryResponse, refreshed after save)
  reserved: number;
  available: number;
  isLowStock: boolean;
  isOutOfStock: boolean;
  // Saved baseline (for dirty detection and rollback)
  _saved: {
    sku: string;
    priceOverride: string;
    isActive: boolean;
    onHand: string;
    lowStockThreshold: string;
  };
  // UI state
  rowError: string | null;
}

function isVariantRowDirty(row: VariantRowState): boolean {
  return (
    row.sku !== row._saved.sku ||
    row.priceOverride !== row._saved.priceOverride ||
    row.isActive !== row._saved.isActive ||
    row.onHand !== row._saved.onHand ||
    row.lowStockThreshold !== row._saved.lowStockThreshold
  );
}

function variantResponseToRow(v: VariantResponse): VariantRowState {
  const onHand = v.availableStock != null ? String(v.availableStock) : "0";
  const lowStockThreshold = "0";
  const sku = v.sku ?? "";
  const priceOverride = v.priceOverride != null ? String(v.priceOverride) : "";
  return {
    id: v.id,
    attributeValueIds: v.attributeValueIds,
    attributes: v.attributes,
    images: v.images,
    sku,
    priceOverride,
    isActive: v.isActive,
    sortOrder: v.sortOrder,
    onHand,
    lowStockThreshold,
    reserved: 0,
    available: v.availableStock ?? 0,
    isLowStock: false,
    isOutOfStock: (v.availableStock ?? 0) === 0,
    _saved: { sku, priceOverride, isActive: v.isActive, onHand, lowStockThreshold },
    rowError: null,
  };
}

function mergeInventoryIntoRow(row: VariantRowState, inv: InventoryResponse): VariantRowState {
  return {
    ...row,
    onHand: String(inv.onHand),
    lowStockThreshold: String(inv.lowStockThreshold),
    reserved: inv.reserved,
    available: inv.available,
    isLowStock: inv.isLowStock,
    isOutOfStock: inv.isOutOfStock,
    _saved: {
      ...row._saved,
      onHand: String(inv.onHand),
      lowStockThreshold: String(inv.lowStockThreshold),
    },
  };
}

function mergeVariantResponseIntoRow(row: VariantRowState, v: VariantResponse): VariantRowState {
  const sku = v.sku ?? "";
  const priceOverride = v.priceOverride != null ? String(v.priceOverride) : "";
  return {
    ...row,
    sku,
    priceOverride,
    isActive: v.isActive,
    sortOrder: v.sortOrder,
    attributeValueIds: v.attributeValueIds,
    attributes: v.attributes,
    images: v.images,
    _saved: {
      ...row._saved,
      sku,
      priceOverride,
      isActive: v.isActive,
    },
    rowError: null,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Variant matrix row — always editable, no save button, no stock button
// ─────────────────────────────────────────────────────────────────────────────

interface VariantMatrixRowProps {
  productId: string;
  row: VariantRowState;
  attrLabel: string;
  productPrice: number;
  saving: boolean;
  onChange: (id: string, patch: Partial<VariantRowState>) => void;
  onDelete: (row: VariantRowState) => void;
}

function VariantMatrixRow({ productId, row, attrLabel, productPrice, saving, onChange, onDelete }: VariantMatrixRowProps) {
  const isDirty = isVariantRowDirty(row);
  const displayPrice = row.priceOverride !== "" ? parseFloat(row.priceOverride) || 0 : productPrice;

  return (
    <tr className={cn("border-b border-border last:border-none hover:bg-surface/40", isDirty && "bg-warning/5")}>
      {/* Attribute label */}
      <td className="py-2 pl-4 pr-2 min-w-0 max-w-[180px]">
        {attrLabel ? (
          <div className="flex items-center gap-1.5">
            <span className="block text-body-sm font-medium text-foreground truncate" title={attrLabel}>
              {attrLabel}
            </span>
            {isDirty && (
              <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-warning" title="Unsaved changes" aria-label="Unsaved changes" />
            )}
          </div>
        ) : (
          <span className="block text-body-sm text-foreground-muted italic">no attrs</span>
        )}
      </td>

      {/* Variant images */}
      <td className="py-2 px-2">
        <VariantImageManager
          productId={productId}
          variantId={row.id}
          variantLabel={attrLabel || row.sku || undefined}
          initialImages={row.images ?? []}
        />
      </td>

      {/* Price override */}
      <td className="py-2 px-2">
        <div className="flex flex-col gap-0.5">
          <input
            type="number"
            min={0}
            step={0.01}
            value={row.priceOverride}
            onChange={(e) => onChange(row.id, { priceOverride: e.target.value })}
            placeholder={`${productPrice} (inherit)`}
            aria-label="Price override"
            disabled={saving}
            className="w-28 h-7 px-2 rounded border border-border bg-background text-body-sm text-foreground focus:outline-none focus:ring-1 focus:ring-focus disabled:opacity-50"
          />
          {row.priceOverride === "" && (
            <span className="text-[10px] text-foreground-muted">= {formatPrice(displayPrice, "INR")}</span>
          )}
        </div>
      </td>

      {/* SKU */}
      <td className="py-2 px-2">
        <input
          type="text"
          value={row.sku}
          onChange={(e) => onChange(row.id, { sku: e.target.value })}
          placeholder="Optional"
          aria-label="SKU"
          disabled={saving}
          className="w-32 h-7 px-2 rounded border border-border bg-background text-body-sm text-foreground focus:outline-none focus:ring-1 focus:ring-focus disabled:opacity-50"
        />
      </td>

      {/* Stock on hand */}
      <td className="py-2 px-2">
        <div className="flex flex-col gap-1">
          <input
            type="number"
            min={0}
            value={row.onHand}
            onChange={(e) => onChange(row.id, { onHand: e.target.value })}
            placeholder="0"
            aria-label="On hand"
            disabled={saving}
            className="w-20 h-7 px-2 rounded border border-border bg-background text-body-sm text-foreground focus:outline-none focus:ring-1 focus:ring-focus disabled:opacity-50"
          />
          <input
            type="number"
            min={0}
            value={row.lowStockThreshold}
            onChange={(e) => onChange(row.id, { lowStockThreshold: e.target.value })}
            placeholder="Threshold"
            aria-label="Low stock threshold"
            disabled={saving}
            className="w-20 h-7 px-2 rounded border border-border bg-background text-[10px] text-foreground-muted focus:outline-none focus:ring-1 focus:ring-focus disabled:opacity-50"
          />
        </div>
      </td>

      {/* Stock badge */}
      <td className="py-2 px-2">
        <div className="flex flex-col gap-1 items-start">
          <StockBadge inv={row} />
          <span className="text-[10px] text-foreground-muted">avail: {row.available}</span>
        </div>
      </td>

      {/* Active toggle */}
      <td className="py-2 px-2">
        <button
          type="button"
          role="switch"
          aria-checked={row.isActive}
          aria-label={row.isActive ? "Deactivate variant" : "Activate variant"}
          onClick={() => onChange(row.id, { isActive: !row.isActive })}
          disabled={saving}
          className={cn(
            "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:opacity-50",
            row.isActive ? "bg-success" : "bg-muted",
          )}
        >
          <span className={cn("inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform", row.isActive ? "translate-x-4" : "translate-x-0.5")} />
        </button>
      </td>

      {/* Delete */}
      <td className="py-2 pl-2 pr-4">
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Delete variant"
            onClick={() => onDelete(row)}
            disabled={saving}
            className="h-6 w-6 flex items-center justify-center rounded text-foreground-muted hover:bg-danger/10 hover:text-danger disabled:opacity-30"
          >
            <Trash2 className="size-3" />
          </button>
        </div>
        {row.rowError && <p className="text-[10px] text-danger mt-0.5">{row.rowError}</p>}
      </td>
    </tr>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Variant editor
// Owns all variant row state. Exposes getDirtyRows() and rollback() for the
// top-level save orchestrator.
// ─────────────────────────────────────────────────────────────────────────────

export interface VariantEditorHandle {
  getDirtyRows: () => VariantRowState[];
  rollback: () => void;
  applyRowSaveResults: (rowId: string, stockRes: InventoryResponse, variantRes: VariantResponse) => void;
  markAllClean: () => void;
}

interface VariantEditorProps {
  productId: string;
  attributes: ProductAttributeItem[];
  productPrice: number;
  globalSaving: boolean;
  variantEditorRef: React.MutableRefObject<VariantEditorHandle | null>;
  onVariantDirtyChange: (dirty: boolean) => void;
  onRefreshVariants: () => void;
}

function VariantEditor({
  productId,
  attributes,
  productPrice,
  globalSaving,
  variantEditorRef,
  onVariantDirtyChange,
  onRefreshVariants,
}: VariantEditorProps) {
  const [rows, setRows] = useState<VariantRowState[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<VariantRowState | null>(null);
  const [deleting, setDeleting] = useState(false);
  // Snapshot for rollback
  const snapshotRef = useRef<VariantRowState[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await adminVariantsApi.list(productId);
    if (res.ok) {
      const loaded = (res.data ?? []).filter(Boolean).map(variantResponseToRow);
      setRows(loaded);
      snapshotRef.current = loaded;
    }
    setLoading(false);
  }, [productId]);

  useEffect(() => { void load(); }, [load]);

  // Expose handle to parent
  useEffect(() => {
    variantEditorRef.current = {
      getDirtyRows: () => rows.filter(isVariantRowDirty),
      rollback: () => {
        setRows(snapshotRef.current.map((r) => ({ ...r, rowError: null })));
      },
      applyRowSaveResults: (rowId, stockRes, variantRes) => {
        setRows((prev) => prev.map((r) => {
          if (r.id !== rowId) return r;
          let next = mergeInventoryIntoRow(r, stockRes);
          next = mergeVariantResponseIntoRow(next, variantRes);
          return next;
        }));
      },
      markAllClean: () => {
        setRows((prev) => {
          const clean = prev.map((r) => ({
            ...r,
            _saved: { sku: r.sku, priceOverride: r.priceOverride, isActive: r.isActive, onHand: r.onHand, lowStockThreshold: r.lowStockThreshold },
            rowError: null,
          }));
          snapshotRef.current = clean;
          return clean;
        });
      },
    };
  }, [rows, variantEditorRef]);

  // Build id → label lookup from attributes
  const valueLookup = new Map<string, string>();
  for (const attr of attributes) {
    for (const v of attr.values) valueLookup.set(v.id, v.value);
  }

  function getAttrLabel(row: VariantRowState): string {
    // Prefer resolved attributes array
    if (row.attributes?.length) {
      return row.attributes.map((a) => a.value).join(" · ");
    }
    const ids = parseIds(row.attributeValueIds);
    if (!ids.length) return "";
    return ids.map((id) => valueLookup.get(id) ?? id.slice(0, 6)).join(" · ");
  }

  function handleChange(id: string, patch: Partial<VariantRowState>) {
    setRows((prev) => {
      const next = prev.map((r) => r.id === id ? { ...r, ...patch } : r);
      const hasDirty = next.some(isVariantRowDirty);
      onVariantDirtyChange(hasDirty);
      return next;
    });
  }

  async function handleGenerate() {
    if (attributes.length === 0) { setGenerateError("Define attribute axes first."); return; }
    setGenerateError(""); setGenerating(true);

    const axes: ProductAttributeValueItem[][] = attributes.map((a) =>
      a.values.slice().sort((x, y) => x.sortOrder - y.sortOrder)
    );

    const existing = new Set(rows.map((r) => canonical(parseIds(r.attributeValueIds))));
    const combos = [...cartesian(axes)];
    const missing = combos.filter((c) => !existing.has(canonical(c.map((i) => i.id))));

    if (missing.length === 0) { setGenerateError("All combinations already exist."); setGenerating(false); return; }

    let created = 0;
    let lastError = "";
    for (const combo of missing) {
      const res = await adminVariantsApi.create(productId, { attributeValueIds: combo.map((v) => v.id) });
      if (res.ok) created++;
      else lastError = extractApiError(res.error, "Create failed.");
    }

    setGenerating(false);
    if (lastError && created === 0) { setGenerateError(lastError); return; }
    if (lastError) setGenerateError(`${created} created, some failed: ${lastError}`);
    await load();
    onRefreshVariants();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    await adminVariantsApi.delete(productId, deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
    await load();
    onRefreshVariants();
  }

  const dirtyCount = rows.filter(isVariantRowDirty).length;
  const axisCount = attributes.length;
  const incompleteRows = rows.filter((r) => r != null && parseIds(r.attributeValueIds).length < axisCount && axisCount > 0);

  if (loading) {
    return (
      <div className="px-4 py-6">
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 rounded bg-muted/40 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-2 flex-wrap px-4 py-3">
        <p className="text-caption text-foreground-muted">
          {rows.length} combination{rows.length !== 1 ? "s" : ""}
          {dirtyCount > 0 && ` · ${dirtyCount} with unsaved changes`}
        </p>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleGenerate}
          loading={generating}
          className="gap-1.5"
          disabled={attributes.length === 0 || globalSaving}
          title={attributes.length === 0 ? "Define attribute axes first" : "Generate missing combinations"}
        >
          <Zap className="size-3.5" />
          Generate combinations
        </Button>
      </div>

      {generateError && (
        <p className="text-caption text-danger flex items-center gap-1.5 px-4 pb-2">
          <AlertTriangle className="size-3.5 shrink-0" /> {generateError}
        </p>
      )}

      {incompleteRows.length > 0 && (
        <div className="flex items-start gap-2 rounded-md bg-warning/10 border border-warning/30 px-2.5 py-2 mx-4 mb-3">
          <AlertTriangle className="size-3.5 text-warning mt-0.5 shrink-0" aria-hidden="true" />
          <p className="text-caption text-warning">
            {incompleteRows.length} variant{incompleteRows.length !== 1 ? "s are" : " is"} missing values for some axes.
          </p>
        </div>
      )}

      {rows.length > 0 ? (
        <div className="overflow-x-auto border-t border-border">
          <table className="w-full text-left">
            <thead className="bg-muted/40">
              <tr className="border-b border-border">
                <th className="py-2 pl-4 pr-2 text-caption font-semibold text-foreground-muted">Variant</th>
                <th className="py-2 px-2 text-caption font-semibold text-foreground-muted">Images</th>
                <th className="py-2 px-2 text-caption font-semibold text-foreground-muted">Price override</th>
                <th className="py-2 px-2 text-caption font-semibold text-foreground-muted">SKU</th>
                <th className="py-2 px-2 text-caption font-semibold text-foreground-muted">
                  <span className="block">On hand</span>
                  <span className="block text-[10px] font-normal text-foreground-muted/70">/ threshold</span>
                </th>
                <th className="py-2 px-2 text-caption font-semibold text-foreground-muted">Stock</th>
                <th className="py-2 px-2 text-caption font-semibold text-foreground-muted">Active</th>
                <th className="py-2 pl-2 pr-4 text-caption font-semibold text-foreground-muted w-12"></th>
              </tr>
            </thead>
            <tbody>
              {rows
                .slice()
                .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
                .map((row) => (
                  <VariantMatrixRow
                    key={row.id}
                    productId={productId}
                    row={row}
                    attrLabel={getAttrLabel(row)}
                    productPrice={productPrice}
                    saving={globalSaving}
                    onChange={handleChange}
                    onDelete={setDeleteTarget}
                  />
                ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="border-t border-dashed border-border mx-4 mb-4 mt-1 rounded-lg p-6 text-center">
          <p className="text-body-sm text-foreground-muted">No variants yet.</p>
          <p className="text-caption text-foreground-muted mt-1">
            {attributes.length > 0
              ? 'Click "Generate combinations" to create all axis combinations.'
              : "Define attribute axes above first, then generate combinations."}
          </p>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete variant"
        description={`Delete variant "${deleteTarget ? (getAttrLabel(deleteTarget) || deleteTarget.sku || deleteTarget.id.slice(0, 8)) : ""}"? This cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        loading={deleting}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Save button states
// ─────────────────────────────────────────────────────────────────────────────

type SaveState = "idle" | "saving" | "saved" | "error";

// ─────────────────────────────────────────────────────────────────────────────
// Main ProductForm — 3-button toolbar + consolidated save
// ─────────────────────────────────────────────────────────────────────────────

interface ProductFormProps {
  product: ProductResponse | null;
  categories: CategoryResponse[];
  brands: BrandResponse[];
  onRefresh?: () => void;
}

export function ProductForm({ product, categories, brands, onRefresh }: ProductFormProps) {
  const router = useRouter();
  const isEdit = !!product;
  const productId = product?.id ?? null;

  // ── Basic info form state ──────────────────────────────────────────────────
  const [form, setForm] = useState<CreateProductRequest>({
    name: product?.name ?? "",
    slug: product?.slug ?? "",
    sku: product?.sku ?? "",
    price: product?.price ?? 0,
    compareAtPrice: product?.compareAtPrice,
    description: product?.description ?? "",
    shortDescription: product?.shortDescription ?? "",
    categoryId: product?.categoryId ?? "",
    brandId: product?.brandId ?? "",
    isFeatured: product?.isFeatured ?? false,
    isTaxable: product?.isTaxable ?? true,
    metaTitle: product?.metaTitle ?? "",
    metaDescription: product?.metaDescription ?? "",
    metaKeywords: product?.metaKeywords ?? "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Attributes state (lifted here for save orchestration) ─────────────────
  const [attributes, setAttributes] = useState<ProductAttributeItem[]>(
    product?.attributes?.map((a) => ({
      id: a.id,
      name: a.name ?? "",
      sortOrder: a.sortOrder ?? 0,
      values: (a.values ?? []).map((v) => ({ id: v.id, value: v.value ?? "", sortOrder: v.sortOrder })),
    })) ?? []
  );

  // ── Dirty tracking ─────────────────────────────────────────────────────────
  const [basicInfoDirty, setBasicInfoDirty] = useState(false);
  const [axisDirtyMap, setAxisDirtyMap] = useState<Record<string, boolean>>({});
  const [variantsDirty, setVariantsDirty] = useState(false);

  const attributesDirty = Object.values(axisDirtyMap).some(Boolean);
  const isDirty = basicInfoDirty || attributesDirty || variantsDirty;

  // ── Refs to child editors ──────────────────────────────────────────────────
  const axisRefs = useRef<Map<string, AttributeAxisHandle>>(new Map());
  const variantEditorRef = useRef<VariantEditorHandle | null>(null);

  // ── Save/publish state ────────────────────────────────────────────────────
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [productStatus, setProductStatus] = useState(product?.status ?? "Draft");

  // ─── Snapshot on first render and after successful save ────────────────────
  const savedFormRef = useRef<CreateProductRequest>({ ...form });

  function set<K extends keyof CreateProductRequest>(key: K, value: CreateProductRequest[K]) {
    setForm((f) => {
      const next = { ...f, [key]: value };
      const changed = JSON.stringify(next) !== JSON.stringify(savedFormRef.current);
      setBasicInfoDirty(changed);
      return next;
    });
  }

  function handleNameChange(name: string) {
    setForm((f) => {
      const next = { ...f, name, slug: f.slug ? f.slug : slugify(name) };
      const changed = JSON.stringify(next) !== JSON.stringify(savedFormRef.current);
      setBasicInfoDirty(changed);
      return next;
    });
  }

  function handleAxisDirtyChange(attrId: string, dirty: boolean) {
    setAxisDirtyMap((prev) => ({ ...prev, [attrId]: dirty }));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name?.trim()) e.name = "Product name is required.";
    if (form.price < 0) e.price = "Price must be non-negative.";
    if (!form.price && form.price !== 0) e.price = "Price is required.";
    return e;
  }

  // ── Cancel — reload from server ────────────────────────────────────────────
  async function handleCancel() {
    if (!productId) { router.push("/admin/products"); return; }
    // Trigger parent reload — this re-mounts ProductForm with fresh server data
    if (onRefresh) onRefresh();
    else router.push("/admin/products");
  }

  // ── Publish — independent state transition ─────────────────────────────────
  async function handlePublish() {
    if (!productId) return;
    setPublishing(true);
    const isPublished = productStatus === "Published";
    const res = isPublished
      ? await adminProductsApi.unpublish(productId)
      : await adminProductsApi.publish(productId);
    setPublishing(false);
    if (res.ok) {
      setProductStatus(isPublished ? "Draft" : "Published");
    }
  }

  // ── Save — orchestrate all dirty sections in parallel ─────────────────────
  async function handleSave() {
    if (!isEdit || !productId) {
      // New product: just submit
      const errs = validate();
      if (Object.keys(errs).length) { setErrors(errs); return; }
      setErrors({}); setSaveState("saving"); setSaveError("");
      const payload: CreateProductRequest = {
        ...form,
        slug: form.slug?.trim() || slugify(form.name ?? ""),
        sku: form.sku?.trim() || undefined,
        categoryId: form.categoryId || undefined,
        brandId: form.brandId || undefined,
        compareAtPrice: form.compareAtPrice || undefined,
      };
      const res = await adminProductsApi.create(payload);
      if (res.ok) {
        setSaveState("idle");
        router.push(`/admin/products/${res.data.id}`);
      } else {
        setSaveState("error");
        setSaveError(extractApiError(res.error, "Failed to create product."));
      }
      return;
    }

    if (!isDirty) return;

    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setSaveState("saving");
    setSaveError("");

    // Snapshot all axis payloads before trying to save
    const axisPayloads: Array<{ attrId: string; payload: { name: string; values: Array<{ value: string; id?: string }> } }> = [];
    for (const [attrId, handle] of axisRefs.current) {
      if (!handle.isDirty()) continue;
      const payload = handle.getSavePayload();
      if (!payload) {
        setSaveState("error");
        setSaveError("Please fix attribute errors before saving.");
        return;
      }
      axisPayloads.push({ attrId, payload });
    }

    const dirtyRows = variantEditorRef.current?.getDirtyRows() ?? [];

    // Build all parallel calls
    const calls: Promise<void>[] = [];
    const results: Record<string, unknown>[] = [];

    // Basic info
    if (basicInfoDirty) {
      calls.push(
        adminProductsApi.update(productId, {
          ...form,
          slug: form.slug?.trim() || slugify(form.name ?? ""),
          sku: form.sku?.trim() || undefined,
          categoryId: form.categoryId || undefined,
          brandId: form.brandId || undefined,
          compareAtPrice: form.compareAtPrice || undefined,
          metaTitle: form.metaTitle?.trim() || undefined,
          metaDescription: form.metaDescription?.trim() || undefined,
          metaKeywords: form.metaKeywords?.trim() || undefined,
        }).then((res) => {
          if (!res.ok) throw new Error(extractApiError(res.error, "Failed to save product info."));
          results.push({ type: "basicInfo", data: res.data });
        })
      );
    }

    // Attribute axes — one PUT per dirty axis
    for (const { attrId, payload } of axisPayloads) {
      calls.push(
        adminAttributesApi.upsert(productId, payload).then((res) => {
          if (!res.ok) throw new Error(extractApiError(res.error, `Failed to save attribute "${payload.name}".`));
          results.push({ type: "attribute", attrId, data: res.data });
        })
      );
    }

    // Dirty variant rows — variant + stock in parallel per row
    for (const row of dirtyRows) {
      const onHandParsed = parseInt(row.onHand);
      const thresholdParsed = row.lowStockThreshold.trim() !== "" ? parseInt(row.lowStockThreshold) : undefined;
      const priceOverrideParsed = row.priceOverride !== "" ? parseFloat(row.priceOverride) : undefined;

      calls.push(
        Promise.all([
          adminVariantsApi.update(productId, row.id, {
            sku: row.sku.trim() || undefined,
            priceOverride: priceOverrideParsed,
            isActive: row.isActive,
            sortOrder: row.sortOrder,
          }),
          adminInventoryApi.set(productId, {
            onHand: isNaN(onHandParsed) ? 0 : onHandParsed,
            lowStockThreshold: isNaN(thresholdParsed as number) ? undefined : thresholdParsed,
          }, row.id),
        ]).then(([variantRes, stockRes]) => {
          if (!variantRes.ok) throw new Error(extractApiError(variantRes.error, `Variant save failed for row ${row.sku || row.id.slice(0, 6)}.`));
          if (!stockRes.ok) throw new Error(extractApiError(stockRes.error, `Stock save failed for row ${row.sku || row.id.slice(0, 6)}.`));
          results.push({ type: "variant", rowId: row.id, variantData: variantRes.data, stockData: stockRes.data });
          // Merge immediately on success
          variantEditorRef.current?.applyRowSaveResults(row.id, stockRes.data, variantRes.data);
        })
      );
    }

    try {
      await Promise.all(calls);

      // Clear dirty state everywhere
      savedFormRef.current = { ...form };
      setBasicInfoDirty(false);
      setAxisDirtyMap({});
      setVariantsDirty(false);
      for (const [, handle] of axisRefs.current) handle.markClean();
      variantEditorRef.current?.markAllClean();

      // Update attributes from the last attribute save result
      const attrResult = results.filter((r) => r.type === "attribute").at(-1);
      if (attrResult?.data) {
        const attrData = attrResult.data as { attributes: ProductAttributeItem[] };
        if (attrData.attributes) setAttributes(attrData.attributes);
      }

      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2000);
    } catch (err) {
      // All-or-nothing: rollback everything
      variantEditorRef.current?.rollback();
      setForm({ ...savedFormRef.current });
      setBasicInfoDirty(false);

      setSaveState("error");
      setSaveError(err instanceof Error ? err.message : "Save failed. Please retry.");
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  const isSaving = saveState === "saving";

  // ── Toolbar (fixed to viewport, below AdminTopBar) ───────────────────────
  // Fixed positioning removes it from the main scroll flow.
  // z-30 matches AdminTopBar so it sits alongside (AdminTopBar is z-30).
  // left-0 + lg:left-64 accounts for the sidebar width (256px = 64*4 in Tailwind).
  const toolbar = (
    <div className="fixed top-14 left-0 lg:left-64 right-0 z-30 bg-background border-b border-border shadow-sm">
      {/* Breadcrumb row */}
      <div className="flex items-center gap-1.5 px-4 sm:px-6 pt-3 pb-1.5 text-caption text-foreground-muted">
        <span
          role="button"
          tabIndex={0}
          onClick={() => router.push("/admin/products")}
          onKeyDown={(e) => e.key === "Enter" && router.push("/admin/products")}
          className="hover:text-foreground transition-colors cursor-pointer"
        >
          Products
        </span>
        <span aria-hidden="true" className="text-border">›</span>
        <span className="text-foreground font-medium truncate">
          {isEdit ? (product!.name ?? "Edit Product") : "New Product"}
        </span>
      </div>

      {/* Main header row */}
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 pb-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Product thumbnail */}
          {isEdit && product!.primaryImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product!.primaryImageUrl}
              alt={product!.name ?? "Product"}
              className="h-9 w-9 rounded-md object-cover bg-muted border border-border shrink-0"
            />
          )}
          <h1 className="text-[17px] font-bold text-foreground truncate leading-tight">
            {isEdit ? (product!.name ?? "Edit Product") : "New Product"}
          </h1>
          {isEdit && <AdminStatusBadge status={productStatus} />}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Cancel */}
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSaving}
            className="h-8 px-3 rounded-md border border-border text-body-sm text-foreground hover:bg-muted/60 disabled:opacity-40 transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
            Cancel
          </button>

          {/* Publish */}
          {isEdit && (
            <button
              type="button"
              onClick={handlePublish}
              disabled={isSaving || publishing}
              className={cn(
                "h-8 px-3 rounded-md border text-body-sm font-medium transition-colors flex items-center gap-1.5 disabled:opacity-40",
                productStatus === "Published"
                  ? "border-border text-foreground hover:bg-muted/60"
                  : "border-success/40 text-success bg-success/5 hover:bg-success/10"
              )}
            >
              {publishing
                ? <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                : null}
              {productStatus === "Published" ? "Unpublish" : "Publish"}
            </button>
          )}

          {/* Save */}
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || (isEdit && !isDirty)}
            className={cn(
              "h-8 px-4 rounded-md text-body-sm font-semibold transition-all flex items-center gap-1.5 disabled:opacity-40",
              saveState === "error"
                ? "bg-danger text-white hover:bg-danger/90"
                : saveState === "saved"
                ? "bg-success text-white"
                : "bg-[#0D0D0D] text-white hover:bg-[#1a1a1a]"
            )}
          >
            {saveState === "saving" && (
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" aria-hidden="true" />
            )}
            {saveState === "saved" && <Check className="size-3.5" aria-hidden="true" />}
            {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved ✓" : saveState === "error" ? "Retry" : isEdit ? "Save" : "Create Product"}
          </button>
        </div>
      </div>

      {/* Inline save error */}
      {saveState === "error" && saveError && (
        <p role="alert" className="px-4 sm:px-6 pb-2 text-caption text-danger">
          {saveError}
        </p>
      )}
    </div>
  );

  // ── Right panel: Attribute Axes + Images (sticky alongside scrolling left) ─
  // The toolbar is fixed at top-14 (56px AdminTopBar) + ~80px of its own height = 136px from viewport top.
  // The right panel sticks below the fixed toolbar.
  const rightPanel = isEdit && productId ? (
    <div className="hidden lg:flex flex-col gap-4 w-[300px] xl:w-[320px] shrink-0 self-start sticky top-[80px] max-h-[calc(100vh-56px-80px-56px)] overflow-y-auto pb-4">
      {/* Attribute Axes */}
      <Card title="Attribute Axes">
        <p className="text-caption text-foreground-muted -mt-1">
          Define the dimensions your product varies on (e.g. "Colour", "Storage"). Edit values here, then click Save.
        </p>
        <AttributeEditor
          productId={productId}
          variants={
            variantEditorRef.current
              ? variantEditorRef.current.getDirtyRows()
              : []
          }
          attributes={attributes}
          axisRefs={axisRefs}
          onAttributesChange={setAttributes}
          onAxisDirtyChange={handleAxisDirtyChange}
          onRefreshVariants={() => { /* handled by VariantEditor's own load */ }}
        />
      </Card>

      {/* Images — only when no variants/attributes */}
      {attributes.length === 0 && (
        <Card title="Images">
          <ImageManager
            productId={productId}
            images={product!.images}
            onRefresh={() => { if (onRefresh) onRefresh(); }}
          />
        </Card>
      )}
    </div>
  ) : null;

  return (
    <>
      {toolbar}

      {/* Spacer for fixed toolbar — prevents body from being hidden under it */}
      <div className="h-[80px] shrink-0" aria-hidden="true" />

      {/* ── Two-panel body ─────────────────────────────────────────────────── */}
      {/* Left scrolls freely; right panel is sticky inside the shell's scroll */}
      <div className="flex gap-4 px-4 sm:px-6 pt-4 pb-6 items-start min-w-0">

        {/* ── Left: main content ─────────────────────────────────────────── */}
        <div className="flex flex-col gap-4 min-w-0 flex-1">

          {/* Row 1: Basic info grid */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {/* Basic Information */}
            <Card title="Basic Information">
              <Input
                label="Product name"
                required
                value={form.name ?? ""}
                onChange={(e) => handleNameChange(e.target.value)}
                error={errors.name}
              />
              <Input
                label="Slug"
                value={form.slug ?? ""}
                onChange={(e) => set("slug", e.target.value)}
                hint="Auto-generated from name if blank."
              />
              <Input
                label="SKU"
                value={form.sku ?? ""}
                onChange={(e) => set("sku", e.target.value)}
                placeholder="e.g. PROD-001"
              />
            </Card>

            {/* Description */}
            <Card title="Description">
              <div className="flex flex-col gap-1.5">
                <label className="text-body-sm font-medium text-foreground">Description</label>
                <textarea
                  value={form.description ?? ""}
                  onChange={(e) => set("description", e.target.value)}
                  rows={5}
                  aria-label="Product description"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-body-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-focus resize-none"
                  placeholder="Detailed product description…"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-body-sm font-medium text-foreground">Short description</label>
                <textarea
                  value={form.shortDescription ?? ""}
                  onChange={(e) => set("shortDescription", e.target.value)}
                  rows={2}
                  aria-label="Short description"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-body-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-focus resize-none"
                  placeholder="Brief summary for product cards…"
                />
              </div>
            </Card>

            {/* SEO */}
            <Card title="SEO">
              <Input label="Meta title" value={form.metaTitle ?? ""} onChange={(e) => set("metaTitle", e.target.value)} />
              <div className="flex flex-col gap-1.5">
                <label className="text-body-sm font-medium text-foreground">Meta description</label>
                <textarea
                  value={form.metaDescription ?? ""}
                  onChange={(e) => set("metaDescription", e.target.value)}
                  rows={3}
                  aria-label="Meta description"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-body-sm text-foreground focus:outline-none focus:ring-2 focus:ring-focus resize-none"
                />
              </div>
              <Input label="Meta keywords" value={form.metaKeywords ?? ""} onChange={(e) => set("metaKeywords", e.target.value)} hint="Comma-separated." />
            </Card>
          </div>

          {/* Row 2: Pricing / Organisation / Settings / Stock */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
            <Card title="Pricing">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Price"
                  type="number"
                  min={0}
                  step={0.01}
                  required
                  value={form.price}
                  onChange={(e) => set("price", parseFloat(e.target.value) || 0)}
                  error={errors.price}
                />
                <Input
                  label="Compare-at"
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.compareAtPrice ?? ""}
                  onChange={(e) => set("compareAtPrice", e.target.value ? parseFloat(e.target.value) : undefined)}
                />
              </div>
            </Card>

            <Card title="Organisation">
              <div className="flex flex-col gap-1.5">
                <label className="text-body-sm font-medium text-foreground">Category</label>
                <select
                  value={form.categoryId ?? ""}
                  onChange={(e) => set("categoryId", e.target.value || undefined)}
                  aria-label="Category"
                  className="h-9 px-3 rounded-md border border-border bg-background text-body-sm text-foreground focus:outline-none focus:ring-2 focus:ring-focus"
                >
                  <option value="">— None —</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-body-sm font-medium text-foreground">Brand</label>
                <select
                  value={form.brandId ?? ""}
                  onChange={(e) => set("brandId", e.target.value || undefined)}
                  aria-label="Brand"
                  className="h-9 px-3 rounded-md border border-border bg-background text-body-sm text-foreground focus:outline-none focus:ring-2 focus:ring-focus"
                >
                  <option value="">— None —</option>
                  {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            </Card>

            <Card title="Settings">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isFeatured ?? false}
                  onChange={(e) => set("isFeatured", e.target.checked)}
                  className="h-4 w-4 rounded border-border accent-primary"
                />
                <span className="text-body-sm text-foreground">Featured product</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isTaxable ?? true}
                  onChange={(e) => set("isTaxable", e.target.checked)}
                  className="h-4 w-4 rounded border-border accent-primary"
                />
                <span className="text-body-sm text-foreground">Taxable</span>
              </label>
            </Card>

            {/* Product-level stock — only when no variants */}
            {isEdit && productId && (
              <Card title="Stock">
                <p className="text-caption text-foreground-muted -mt-1">
                  {attributes.length > 0
                    ? "Stock is managed per variant in the Variants table below."
                    : "Product-level inventory. Add variants below to enable per-variant stock."}
                </p>
                {attributes.length === 0 && <StockManager productId={productId} />}
              </Card>
            )}
          </div>

          {/* Mobile-only: Attribute Axes + Images (above variants) */}
          {isEdit && productId && (
            <div className="flex flex-col gap-4 lg:hidden">
              <Card title="Attribute Axes">
                <p className="text-caption text-foreground-muted -mt-1">
                  Define the dimensions your product varies on (e.g. "Colour", "Storage"). Edit values here, then click Save.
                </p>
                <AttributeEditor
                  productId={productId}
                  variants={variantEditorRef.current ? variantEditorRef.current.getDirtyRows() : []}
                  attributes={attributes}
                  axisRefs={axisRefs}
                  onAttributesChange={setAttributes}
                  onAxisDirtyChange={handleAxisDirtyChange}
                  onRefreshVariants={() => { /* handled by VariantEditor's own load */ }}
                />
              </Card>
              {attributes.length === 0 && (
                <Card title="Images">
                  <ImageManager
                    productId={productId}
                    images={product!.images}
                    onRefresh={() => { if (onRefresh) onRefresh(); }}
                  />
                </Card>
              )}
            </div>
          )}

          {/* Row 3: Variants — full width of left column */}
          {isEdit && productId && (
            <CardFlush
              title="Variants"
              description={
                isDirty
                  ? <span className="text-warning text-caption">Unsaved changes — click Save in the toolbar to commit all changes.</span>
                  : "Generate all axis combinations, set individual prices, SKUs and stock levels."
              }
            >
              <VariantEditor
                productId={productId}
                attributes={attributes}
                productPrice={form.price}
                globalSaving={isSaving}
                variantEditorRef={variantEditorRef}
                onVariantDirtyChange={setVariantsDirty}
                onRefreshVariants={() => setAttributes((a) => [...a])}
              />
            </CardFlush>
          )}

          {!isEdit && (
            <div className="rounded-lg border border-border bg-muted/30 p-4 text-center">
              <p className="text-caption text-foreground-muted">Images, attributes, variants and stock can be managed after saving the product.</p>
            </div>
          )}
        </div>

        {/* ── Right: sticky attribute + image panel ──────────────────────── */}
        {rightPanel}
      </div>
    </>
  );
}
