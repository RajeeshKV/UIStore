"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Plus, X, Package, GripVertical, Zap, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { adminProductsApi, adminVariantsApi, adminAttributesApi, adminInventoryApi } from "@/services/api/admin";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { AdminPageHeader } from "@/features/admin/AdminPageHeader";
import { ConfirmDialog } from "@/features/admin/AdminDialog";
import { AdminStatusBadge } from "@/features/admin/AdminStatusBadge";
import { formatPrice, cn, extractApiError } from "@/lib/utils";
import type {
  ProductResponse,
  CreateProductRequest,
  CategoryResponse,
  BrandResponse,
  VariantResponse,
  CreateVariantRequest,
  UpdateVariantRequest,
  ProductAttributeItem,
  ProductAttributeValueItem,
  InventoryResponse,
} from "@/types/api";

// ── Helpers ───────────────────────────────────────────────────────────────────

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ── Section card wrapper ──────────────────────────────────────────────────────

function Card({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-lg border border-border bg-background p-4 flex flex-col gap-3", className)}>
      <h3 className="text-body-sm font-semibold text-foreground border-b border-border pb-2">{title}</h3>
      {children}
    </div>
  );
}

// ── Image manager ─────────────────────────────────────────────────────────────

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

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseIds(csv: string | null | undefined): string[] {
  if (!csv) return [];
  return csv.split(",").map((s) => s.trim()).filter(Boolean);
}

/** Returns how many existing variants reference the given attribute value id */
function variantsUsingValue(variants: VariantResponse[], valueId: string): number {
  return variants.filter((v) => v != null && parseIds(v.attributeValueIds).includes(valueId)).length;
}

/** Canonical sorted string for exact-set comparison */
function canonical(ids: string[]): string {
  return [...ids].sort().join(",");
}

/** Generate cartesian product of axes */
function* cartesian<T>(axes: T[][]): Generator<T[]> {
  if (axes.length === 0) { yield []; return; }
  const [head, ...rest] = axes;
  for (const h of head) for (const tail of cartesian(rest)) yield [h, ...tail];
}

// ── Stock pill ────────────────────────────────────────────────────────────────

function StockPill({ inventory }: { inventory: InventoryResponse }) {
  if (inventory.isOutOfStock) return <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold bg-danger/10 text-danger">Out of stock</span>;
  if (inventory.isLowStock) return <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold bg-warning/15 text-warning">Low stock</span>;
  return <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold bg-success/10 text-success">In stock</span>;
}

// ── Stock manager — product-level (no variants) ───────────────────────────────

interface StockManagerProps {
  productId: string;
  label?: string;
}

function StockManager({ productId, label }: StockManagerProps) {
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
      {label && (
        <p className="text-body-sm font-medium text-foreground flex items-center gap-1.5">
          <Package className="size-3.5" aria-hidden="true" />{label}
        </p>
      )}
      {inventory && (
        <div className="flex flex-wrap items-center gap-3 text-caption text-foreground-muted rounded-lg bg-surface border border-border px-3 py-2.5">
          <StockPill inventory={inventory} />
          <span>On hand: <strong className="text-foreground">{inventory.onHand}</strong></span>
          <span>Reserved: <strong className="text-foreground">{inventory.reserved}</strong></span>
          <span>Available: <strong className="text-foreground">{inventory.available}</strong></span>
          <span>Threshold: <strong className="text-foreground">{inventory.lowStockThreshold}</strong></span>
        </div>
      )}
      {!inventory && (
        <p className="text-caption text-foreground-muted">No inventory record yet. Enter values and click Set stock.</p>
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

// ── Attribute editor ──────────────────────────────────────────────────────────
// Per-axis card with add/remove/reorder values. Save sends one PUT per axis with
// the complete value list. Warns when deleting a value referenced by variants.

type EditValue = { id?: string; value: string; _key: string };

interface AttributeAxisCardProps {
  attr: ProductAttributeItem;
  variants: VariantResponse[];
  onSaved: (attrs: ProductAttributeItem[]) => void;
  onDeleteAxis: (attr: ProductAttributeItem) => void;
  productId: string;
}

function AttributeAxisCard({ attr, variants, onSaved, onDeleteAxis, productId }: AttributeAxisCardProps) {
  const [expanded, setExpanded] = useState(true);
  const [editValues, setEditValues] = useState<EditValue[]>(() =>
    attr.values.slice().sort((a, b) => a.sortOrder - b.sortOrder).map((v) => ({ id: v.id, value: v.value, _key: v.id }))
  );
  const [attrName, setAttrName] = useState(attr.name);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const dragIdx = useRef<number | null>(null);

  // Warn about values that will be deleted (present in original but removed from edit list)
  const removedValues = attr.values.filter((v) => !editValues.some((ev) => ev.id === v.id));
  const affectedVariantCount = removedValues.reduce((acc, v) => acc + variantsUsingValue(variants, v.id), 0);

  function markDirty() { setDirty(true); }

  function addValue() { setEditValues((p) => [...p, { value: "", _key: crypto.randomUUID() }]); markDirty(); }

  function removeValue(key: string) { setEditValues((p) => p.filter((v) => v._key !== key)); markDirty(); }

  function updateValue(key: string, val: string) {
    setEditValues((p) => p.map((v) => v._key === key ? { ...v, value: val } : v));
    markDirty();
  }

  function handleNameChange(n: string) { setAttrName(n); markDirty(); }

  // Drag-to-reorder
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

  async function handleSave() {
    if (!attrName.trim()) { setError("Axis name is required."); return; }
    const cleanValues = editValues.filter((v) => v.value.trim());
    if (cleanValues.length === 0) { setError("At least one value is required."); return; }
    setError(""); setSaving(true);
    const res = await adminAttributesApi.upsert(productId, {
      name: attrName.trim(),
      values: cleanValues.map((v) => ({ value: v.value.trim(), ...(v.id ? { id: v.id } : {}) })),
    });
    setSaving(false);
    if (res.ok) { setDirty(false); onSaved(res.data.attributes); }
    else setError(extractApiError(res.error, "Failed to save."));
  }

  return (
    <div className="rounded-lg border border-border bg-surface overflow-hidden">
      {/* Axis header */}
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
        <div className="flex items-center gap-1 shrink-0">
          {dirty && (
            <Button type="button" variant="primary" size="sm" onClick={handleSave} loading={saving} className="h-6 px-2 text-caption">
              Save
            </Button>
          )}
          <button type="button" aria-label={`Delete ${attr.name} axis`} onClick={() => onDeleteAxis(attr)} className="h-6 w-6 flex items-center justify-center rounded text-foreground-muted hover:bg-danger/10 hover:text-danger">
            <Trash2 className="size-3" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border px-3 py-2.5 flex flex-col gap-2">
          {error && <p className="text-caption text-danger">{error}</p>}

          {/* Warning: removing values used by variants */}
          {affectedVariantCount > 0 && (
            <div className="flex items-start gap-2 rounded-md bg-warning/10 border border-warning/30 px-2.5 py-2">
              <AlertTriangle className="size-3.5 text-warning mt-0.5 shrink-0" aria-hidden="true" />
              <p className="text-caption text-warning">
                Saving will remove {removedValues.length} value{removedValues.length !== 1 ? "s" : ""} used by {affectedVariantCount} variant{affectedVariantCount !== 1 ? "s" : ""}. Those variants will lose this dimension.
              </p>
            </div>
          )}

          {/* Value list */}
          <div className="flex flex-col gap-1.5">
            {editValues.map((ev, idx) => (
              <div
                key={ev._key}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragEnter={() => handleDragEnter(idx)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => e.preventDefault()}
                className={cn(
                  "flex items-center gap-1.5 rounded",
                  dragOver === idx && "ring-1 ring-primary bg-primary/5",
                )}
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

interface AttributeEditorProps {
  productId: string;
  variants: VariantResponse[];
  onRefresh: () => void;
}

function AttributeEditor({ productId, variants, onRefresh }: AttributeEditorProps) {
  const [attributes, setAttributes] = useState<ProductAttributeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newName, setNewName] = useState("");
  const [addingNew, setAddingNew] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProductAttributeItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    const res = await adminAttributesApi.get(productId);
    if (res.ok) setAttributes(res.data.attributes);
    else setError("Failed to load attributes.");
    setLoading(false);
  }, [productId]);

  useEffect(() => { void load(); }, [load]);

  async function handleAddAxis() {
    if (!newName.trim()) return;
    const res = await adminAttributesApi.upsert(productId, { name: newName.trim(), values: [{ value: "Value 1" }] });
    if (res.ok) { setAttributes(res.data.attributes); setNewName(""); setAddingNew(false); onRefresh(); }
  }

  async function handleDeleteAxis() {
    if (!deleteTarget) return;
    setDeleting(true);
    await adminAttributesApi.delete(productId, deleteTarget.id);
    setDeleting(false); setDeleteTarget(null);
    await load(); onRefresh();
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
          attr={attr}
          variants={variants}
          productId={productId}
          onSaved={(attrs) => { setAttributes(attrs); onRefresh(); }}
          onDeleteAxis={setDeleteTarget}
        />
      ))}

      {addingNew ? (
        <div className="flex gap-2 items-center">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") void handleAddAxis(); if (e.key === "Escape") { setAddingNew(false); setNewName(""); } }}
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

// ── Variant matrix ────────────────────────────────────────────────────────────
// Inline-editable table. Generate button computes missing combinations and
// POSTs them. Per-row stock cell manages inventory inline.

interface VariantMatrixRowProps {
  productId: string;
  variant: VariantResponse;
  attrLabel: string;
  productPrice: number;
  onDelete: (v: VariantResponse) => void;
  onUpdated: (v: VariantResponse) => void;
}

function VariantMatrixRow({ productId, variant, attrLabel, productPrice, onDelete, onUpdated }: VariantMatrixRowProps) {
  const [sku, setSku] = useState(variant.sku ?? "");
  const [priceOverride, setPriceOverride] = useState(variant.priceOverride != null ? String(variant.priceOverride) : "");
  const [onHand, setOnHand] = useState(variant.availableStock != null ? String(variant.availableStock) : "");
  const [isActive, setIsActive] = useState(variant.isActive);
  const [saving, setSaving] = useState(false);
  const [stockSaving, setStockSaving] = useState(false);
  const [stockSuccess, setStockSuccess] = useState(false);
  const [error, setError] = useState("");

  const displayPrice = priceOverride !== "" ? parseFloat(priceOverride) || 0 : productPrice;
  const dirty = sku !== (variant.sku ?? "") || priceOverride !== (variant.priceOverride != null ? String(variant.priceOverride) : "") || isActive !== variant.isActive;

  async function handleSave() {
    setSaving(true); setError("");
    const res = await adminVariantsApi.update(productId, variant.id, {
      sku: sku.trim() || undefined,
      priceOverride: priceOverride !== "" ? parseFloat(priceOverride) : undefined,
      isActive,
    });
    setSaving(false);
    if (res.ok) onUpdated(res.data);
    else setError(extractApiError(res.error, "Failed."));
  }

  async function handleSetStock() {
    const parsed = parseInt(onHand);
    if (isNaN(parsed) || parsed < 0) { setError("On-hand must be ≥ 0."); return; }
    setStockSaving(true); setError("");
    const res = await adminInventoryApi.set(productId, { onHand: parsed }, variant.id);
    setStockSaving(false);
    if (res.ok) {
      setStockSuccess(true);
      setTimeout(() => setStockSuccess(false), 2000);
    } else {
      setError(extractApiError(res.error, "Stock failed."));
    }
  }

  return (
    <tr className="group border-b border-border last:border-none hover:bg-surface/60">
      {/* Attribute label */}
      <td className="py-2 pl-3 pr-2 text-body-sm text-foreground min-w-0">
        <span className="font-medium">{attrLabel || <span className="text-foreground-muted italic">no attrs</span>}</span>
      </td>

      {/* Price */}
      <td className="py-2 px-2">
        <div className="flex flex-col gap-0.5">
          <input
            type="number"
            min={0}
            step={0.01}
            value={priceOverride}
            onChange={(e) => setPriceOverride(e.target.value)}
            placeholder={`${productPrice} (inherit)`}
            aria-label="Price override"
            className="w-28 h-7 px-2 rounded border border-border bg-background text-body-sm text-foreground focus:outline-none focus:ring-1 focus:ring-focus"
          />
          {priceOverride === "" && (
            <span className="text-[10px] text-foreground-muted">= {formatPrice(displayPrice, "INR")}</span>
          )}
        </div>
      </td>

      {/* SKU */}
      <td className="py-2 px-2">
        <input
          type="text"
          value={sku}
          onChange={(e) => setSku(e.target.value)}
          placeholder="Optional"
          aria-label="SKU"
          className="w-32 h-7 px-2 rounded border border-border bg-background text-body-sm text-foreground focus:outline-none focus:ring-1 focus:ring-focus"
        />
      </td>

      {/* Stock */}
      <td className="py-2 px-2">
        <div className="flex items-center gap-1">
          <input
            type="number"
            min={0}
            value={onHand}
            onChange={(e) => setOnHand(e.target.value)}
            placeholder="0"
            aria-label="On hand"
            className="w-20 h-7 px-2 rounded border border-border bg-background text-body-sm text-foreground focus:outline-none focus:ring-1 focus:ring-focus"
          />
          <button
            type="button"
            onClick={handleSetStock}
            disabled={stockSaving}
            aria-label="Set stock"
            className={cn(
              "h-7 w-7 flex items-center justify-center rounded border text-[10px] font-semibold transition-colors shrink-0",
              stockSuccess
                ? "bg-success/10 border-success/30 text-success"
                : "border-border text-foreground-muted hover:border-primary hover:text-primary",
              stockSaving && "opacity-50 pointer-events-none",
            )}
          >
            {stockSaving ? "…" : stockSuccess ? "✓" : "↑"}
          </button>
        </div>
      </td>

      {/* Active toggle */}
      <td className="py-2 px-2">
        <button
          type="button"
          role="switch"
          aria-checked={isActive}
          aria-label={isActive ? "Deactivate variant" : "Activate variant"}
          onClick={() => setIsActive((v) => !v)}
          className={cn(
            "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus",
            isActive ? "bg-success" : "bg-muted",
          )}
        >
          <span className={cn("inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform", isActive ? "translate-x-4" : "translate-x-0.5")} />
        </button>
      </td>

      {/* Save / Delete */}
      <td className="py-2 pl-2 pr-3">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {dirty && (
            <Button type="button" variant="primary" size="sm" onClick={handleSave} loading={saving} className="h-6 px-2 text-caption">Save</Button>
          )}
          <button type="button" aria-label="Delete variant" onClick={() => onDelete(variant)} className="h-6 w-6 flex items-center justify-center rounded text-foreground-muted hover:bg-danger/10 hover:text-danger">
            <Trash2 className="size-3" />
          </button>
        </div>
        {error && <p className="text-[10px] text-danger mt-0.5">{error}</p>}
      </td>
    </tr>
  );
}

interface VariantEditorProps {
  productId: string;
  variants: VariantResponse[];
  attributes: ProductAttributeItem[];
  productPrice: number;
  onRefresh: () => void;
}

function VariantEditor({ productId, variants, attributes, productPrice, onRefresh }: VariantEditorProps) {
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<VariantResponse | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [localVariants, setLocalVariants] = useState<VariantResponse[]>(variants);

  useEffect(() => { setLocalVariants((variants ?? []).filter(Boolean)); }, [variants]);

  // Build id → label lookup from attributes
  const valueLookup = new Map<string, { attrName: string; label: string }>();
  for (const attr of attributes) {
    for (const v of attr.values) {
      valueLookup.set(v.id, { attrName: attr.name, label: v.value });
    }
  }

  function getAttrLabel(v: VariantResponse): string {
    const ids = parseIds(v.attributeValueIds);
    if (!ids.length) return "";
    return ids.map((id) => {
      const entry = valueLookup.get(id);
      return entry ? `${entry.attrName}: ${entry.label}` : id.slice(0, 6);
    }).join(" / ");
  }

  // Warn about variants with fewer attribute values than there are axes
  const axisCount = attributes.length;
  const incompleteVariants = localVariants.filter((v) => v != null && parseIds(v.attributeValueIds).length < axisCount && axisCount > 0);

  async function handleGenerate() {
    if (attributes.length === 0) { setGenerateError("Define attribute axes first."); return; }
    setGenerateError(""); setGenerating(true);

    const axes: ProductAttributeValueItem[][] = attributes.map((a) =>
      a.values.slice().sort((x, y) => x.sortOrder - y.sortOrder)
    );

    const existing = new Set(localVariants.filter((v) => v != null).map((v) => canonical(parseIds(v.attributeValueIds))));
    const combos = [...cartesian(axes)];
    const missing = combos.filter((c) => !existing.has(canonical(c.map((i) => i.id))));

    if (missing.length === 0) { setGenerateError("All combinations already exist."); setGenerating(false); return; }

    let created = 0;
    let lastError = "";
    for (const combo of missing) {
      const res = await adminVariantsApi.create(productId, {
        attributeValueIds: combo.map((v) => v.id),
      });
      if (res.ok) created++;
      else lastError = extractApiError(res.error, "Create failed.");
    }

    setGenerating(false);
    if (lastError && created === 0) { setGenerateError(lastError); return; }
    if (lastError) setGenerateError(`${created} created, some failed: ${lastError}`);
    onRefresh();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    await adminVariantsApi.delete(productId, deleteTarget.id);
    setDeleting(false); setDeleteTarget(null);
    onRefresh();
  }

  function handleUpdated(updated: VariantResponse) {
    setLocalVariants((prev) => prev.map((v) => v.id === updated.id ? updated : v));
  }

  const soldOutCount = localVariants.filter((v) => v.availableStock === 0).length;

  return (
    <div className="flex flex-col gap-3">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-caption text-foreground-muted">
          {localVariants.length} combination{localVariants.length !== 1 ? "s" : ""}
          {soldOutCount > 0 && ` · ${soldOutCount} sold out`}
        </p>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleGenerate}
          loading={generating}
          className="gap-1.5"
          disabled={attributes.length === 0}
          title={attributes.length === 0 ? "Define attribute axes first" : "Generate missing combinations"}
        >
          <Zap className="size-3.5" />
          Generate combinations
        </Button>
      </div>

      {generateError && (
        <p className="text-caption text-danger flex items-center gap-1.5">
          <AlertTriangle className="size-3.5 shrink-0" /> {generateError}
        </p>
      )}

      {/* Incomplete combinations warning */}
      {incompleteVariants.length > 0 && (
        <div className="flex items-start gap-2 rounded-md bg-warning/10 border border-warning/30 px-2.5 py-2">
          <AlertTriangle className="size-3.5 text-warning mt-0.5 shrink-0" aria-hidden="true" />
          <p className="text-caption text-warning">
            {incompleteVariants.length} variant{incompleteVariants.length !== 1 ? "s are" : " is"} missing values for some axes. These combinations may be unreachable in the storefront.
          </p>
        </div>
      )}

      {/* Variant table */}
      {localVariants.length > 0 ? (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-muted/40">
              <tr className="border-b border-border">
                <th className="py-2 pl-3 pr-2 text-caption font-semibold text-foreground-muted">Variant</th>
                <th className="py-2 px-2 text-caption font-semibold text-foreground-muted">Price override</th>
                <th className="py-2 px-2 text-caption font-semibold text-foreground-muted">SKU</th>
                <th className="py-2 px-2 text-caption font-semibold text-foreground-muted">Stock (on hand)</th>
                <th className="py-2 px-2 text-caption font-semibold text-foreground-muted">Active</th>
                <th className="py-2 pl-2 pr-3 text-caption font-semibold text-foreground-muted w-24"></th>
              </tr>
            </thead>
            <tbody>
              {localVariants
                .filter((v) => v != null)
                .slice()
                .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
                .map((v) => (
                  <VariantMatrixRow
                    key={v.id}
                    productId={productId}
                    variant={v}
                    attrLabel={getAttrLabel(v)}
                    productPrice={productPrice}
                    onDelete={setDeleteTarget}
                    onUpdated={handleUpdated}
                  />
                ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border p-6 text-center">
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

// ── Main product form ─────────────────────────────────────────────────────────

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
  const [apiError, setApiError] = useState("");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [variants, setVariants] = useState<VariantResponse[]>((product?.variants ?? []).filter(Boolean));
  const [attributes, setAttributes] = useState<ProductAttributeItem[]>([]);

  // Refreshes only local variant + attribute state — does NOT call onRefresh (parent)
  // because that would cause the parent to reload the product, which re-mounts this
  // component and triggers an infinite loop.
  const refreshVariants = useCallback(async () => {
    if (!productId) return;
    const [varRes, attrRes] = await Promise.all([
      adminVariantsApi.list(productId),
      adminAttributesApi.get(productId),
    ]);
    if (varRes.ok) setVariants((varRes.data ?? []).filter(Boolean));
    if (attrRes.ok) setAttributes(attrRes.data.attributes ?? []);
  }, [productId]);

  // Load variants + attributes once on mount for existing products
  useEffect(() => {
    if (productId) void refreshVariants();
  // productId is stable for the lifetime of this edit page
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  function set<K extends keyof CreateProductRequest>(key: K, value: CreateProductRequest[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleNameChange(name: string) {
    setForm((f) => ({ ...f, name, slug: f.slug ? f.slug : slugify(name) }));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name?.trim()) e.name = "Product name is required.";
    if (form.price < 0) e.price = "Price must be non-negative.";
    if (!form.price && form.price !== 0) e.price = "Price is required.";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({}); setApiError(""); setSaving(true);
    const payload: CreateProductRequest = {
      ...form,
      slug: form.slug?.trim() || slugify(form.name ?? ""),
      sku: form.sku?.trim() || undefined,
      categoryId: form.categoryId || undefined,
      brandId: form.brandId || undefined,
      compareAtPrice: form.compareAtPrice || undefined,
      metaTitle: form.metaTitle?.trim() || undefined,
      metaDescription: form.metaDescription?.trim() || undefined,
      metaKeywords: form.metaKeywords?.trim() || undefined,
    };
    const res = isEdit
      ? await adminProductsApi.update(product.id, payload)
      : await adminProductsApi.create(payload);
    setSaving(false);
    if (res.ok) {
      if (!isEdit) router.push(`/admin/products/${res.data.id}`);
      else if (onRefresh) onRefresh();
    } else {
      setApiError(extractApiError(res.error, "Failed to save product."));
    }
  }

  async function handlePublishToggle() {
    if (!isEdit) return;
    setPublishing(true); setApiError("");
    const res = product.status === "Published"
      ? await adminProductsApi.unpublish(product.id)
      : await adminProductsApi.publish(product.id);
    setPublishing(false);
    if (res.ok) { if (onRefresh) onRefresh(); }
    else setApiError(extractApiError(res.error, "Failed to update publish status."));
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <AdminPageHeader
        title={isEdit ? (product.name ?? "Edit Product") : "New Product"}
        description={isEdit ? <AdminStatusBadge status={product.status ?? "Draft"} /> as unknown as string : undefined}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" type="button" onClick={() => router.push("/admin/products")}>Cancel</Button>
            {isEdit && (
              <Button
                variant={product.status === "Published" ? "outline" : "secondary"}
                size="sm"
                type="button"
                loading={publishing}
                onClick={handlePublishToggle}
              >
                {product.status === "Published" ? "Unpublish" : "Publish"}
              </Button>
            )}
            <Button variant="primary" size="sm" type="submit" loading={saving}>
              {isEdit ? "Save Changes" : "Create Product"}
            </Button>
          </div>
        }
      />

      {apiError && (
        <p role="alert" className="text-body-sm text-danger bg-danger/5 border border-danger/20 rounded-md px-4 py-3">
          {apiError}
        </p>
      )}

      {/* ── 3-column grid ──────────────────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-3">

        {/* ── Column 1: Core content ─────────────────────────────────────── */}
        <div className="flex flex-col gap-4">
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

          <Card title="Description">
            <div className="flex flex-col gap-1.5">
              <label className="text-body-sm font-medium text-foreground">Description</label>
              <textarea
                value={form.description ?? ""}
                onChange={(e) => set("description", e.target.value)}
                rows={4}
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

          <Card title="SEO">
            <Input label="Meta title" value={form.metaTitle ?? ""} onChange={(e) => set("metaTitle", e.target.value)} />
            <div className="flex flex-col gap-1.5">
              <label className="text-body-sm font-medium text-foreground">Meta description</label>
              <textarea value={form.metaDescription ?? ""} onChange={(e) => set("metaDescription", e.target.value)} rows={2} aria-label="Meta description" className="w-full rounded-md border border-border bg-background px-3 py-2 text-body-sm text-foreground focus:outline-none focus:ring-2 focus:ring-focus resize-none" />
            </div>
            <Input label="Meta keywords" value={form.metaKeywords ?? ""} onChange={(e) => set("metaKeywords", e.target.value)} hint="Comma-separated." />
          </Card>
        </div>

        {/* ── Column 2: Pricing, Images, Attributes, Variants ───────────── */}
        <div className="flex flex-col gap-4">
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
                label="Compare-at price"
                type="number"
                min={0}
                step={0.01}
                value={form.compareAtPrice ?? ""}
                onChange={(e) => set("compareAtPrice", e.target.value ? parseFloat(e.target.value) : undefined)}
              />
            </div>
          </Card>

          {isEdit && productId && (
            <Card title="Images">
              <ImageManager
                productId={productId}
                images={product.images}
                onRefresh={() => { if (onRefresh) onRefresh(); }}
              />
            </Card>
          )}

          {isEdit && productId && (
            <Card title="Attribute Axes">
              <p className="text-caption text-foreground-muted -mt-1">Define dimensions like "Storage" or "Colour" for variant selection.</p>
              <AttributeEditor productId={productId} variants={variants} onRefresh={refreshVariants} />
            </Card>
          )}

          {isEdit && productId && (
            <Card title="Variants">
              <p className="text-caption text-foreground-muted -mt-1">Generate all axis combinations, set prices, SKUs and stock.</p>
              <VariantEditor productId={productId} variants={variants} attributes={attributes} productPrice={form.price} onRefresh={refreshVariants} />
            </Card>
          )}

          {!isEdit && (
            <div className="rounded-lg border border-border bg-muted/30 p-4 text-center">
              <p className="text-caption text-foreground-muted">Images, attributes, variants and stock can be managed after saving.</p>
            </div>
          )}
        </div>

        {/* ── Column 3: Organisation, Settings, Stock ────────────────────── */}
        <div className="flex flex-col gap-4">
          <Card title="Organisation">
            <div className="flex flex-col gap-1.5">
              <label className="text-body-sm font-medium text-foreground">Category</label>
              <select
                value={form.categoryId ?? ""}
                onChange={(e) => set("categoryId", e.target.value || undefined)}
                aria-label="Category"
                className="h-9 px-3 rounded-md border border-border bg-background text-body-sm text-foreground focus:outline-none focus:ring-2 focus:ring-focus"
              >
                <option value="">— No category —</option>
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
                <option value="">— No brand —</option>
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
          {isEdit && productId && variants.length === 0 && (
            <Card title="Stock">
              <p className="text-caption text-foreground-muted -mt-1">
                Product-level inventory. Add variants above to enable per-variant stock.
              </p>
              <StockManager productId={productId} label="Product stock" />
            </Card>
          )}

          {/* When variants exist, stock is inline per variant in column 2 */}
          {isEdit && productId && variants.length > 0 && (
            <Card title="Stock">
              <p className="text-caption text-foreground-muted">
                Stock is managed per variant — use the inline controls on each variant in the Variants section.
              </p>
            </Card>
          )}
        </div>
      </div>
    </form>
  );
}
