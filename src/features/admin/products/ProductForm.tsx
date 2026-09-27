"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Plus, GripVertical, X } from "lucide-react";
import { adminProductsApi, adminVariantsApi } from "@/services/api/admin";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { AdminPageHeader } from "@/features/admin/AdminPageHeader";
import { ConfirmDialog } from "@/features/admin/AdminDialog";
import { AdminStatusBadge } from "@/features/admin/AdminStatusBadge";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type {
  ProductResponse,
  CreateProductRequest,
  CategoryResponse,
  BrandResponse,
  VariantResponse,
  CreateVariantRequest,
  UpdateVariantRequest,
} from "@/types/api";

// ── Helpers ───────────────────────────────────────────────────────────────────

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-lg border border-border bg-background p-5 flex flex-col gap-4", className)}>
      <h3 className="text-body font-semibold text-foreground border-b border-border pb-3">{title}</h3>
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
  const [url, setUrl] = useState("");
  const [alt, setAlt] = useState("");
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [formError, setFormError] = useState("");

  async function handleAdd() {
    if (!url.trim()) { setFormError("Image URL is required."); return; }
    setFormError("");
    setAdding(true);
    const res = await adminProductsApi.addImage(productId, {
      url: url.trim(),
      altText: alt.trim() || undefined,
      isPrimary: images.length === 0,
    });
    setAdding(false);
    if (res.ok) {
      setUrl("");
      setAlt("");
      onRefresh();
    } else {
      setFormError(
        res.error && "message" in res.error ? res.error.message : "Failed to add image.",
      );
    }
  }

  async function handleDelete(imageId: string) {
    setDeleting(imageId);
    await adminProductsApi.deleteImage(productId, imageId);
    setDeleting(null);
    onRefresh();
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Existing images */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {images.map((img) => (
            <div key={img.id} className="relative group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.asset?.secureUrl ?? ""}
                alt={img.asset?.altText ?? "Product image"}
                className="h-20 w-20 rounded-md object-cover bg-surface border border-border"
              />
              {img.isPrimary && (
                <span className="absolute bottom-0.5 left-0.5 text-[9px] font-medium bg-primary text-primary-foreground rounded px-1">
                  Primary
                </span>
              )}
              <button
                aria-label="Delete image"
                onClick={() => handleDelete(img.id)}
                disabled={deleting === img.id}
                className="absolute -top-1.5 -right-1.5 hidden group-hover:flex h-5 w-5 items-center justify-center rounded-full bg-danger text-white"
              >
                <X className="size-2.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add image by URL */}
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            type="url"
            placeholder="Image URL (https://…)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            aria-label="Image URL"
            className="flex-1 h-9 px-3 rounded-md border border-border bg-background text-body-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-focus"
          />
          <input
            type="text"
            placeholder="Alt text (optional)"
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            aria-label="Alt text"
            className="w-36 h-9 px-3 rounded-md border border-border bg-background text-body-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-focus"
          />
          <Button size="sm" variant="outline" onClick={handleAdd} loading={adding}>
            <Plus className="size-3.5 mr-1" /> Add
          </Button>
        </div>
        {formError && <p className="text-caption text-danger">{formError}</p>}
      </div>
    </div>
  );
}

// ── Variant row ───────────────────────────────────────────────────────────────

interface VariantRowProps {
  variant: VariantResponse;
  onEdit: (v: VariantResponse) => void;
  onDelete: (v: VariantResponse) => void;
}

function VariantRow({ variant, onEdit, onDelete }: VariantRowProps) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-border bg-surface px-3 py-2">
      <GripVertical className="size-4 text-foreground-muted shrink-0 cursor-grab" aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <p className="text-body-sm text-foreground font-medium truncate">
          {variant.sku ?? `Variant ${variant.id.slice(0, 6)}`}
        </p>
        <p className="text-caption text-foreground-muted">
          {variant.priceOverride != null
            ? `Price override: ${formatPrice(variant.priceOverride, "INR")}`
            : "Inherits product price"}
          {" · "}
          {variant.isActive ? "Active" : "Inactive"}
          {variant.availableStock != null && ` · Stock: ${variant.availableStock}`}
        </p>
      </div>
      <div className="flex gap-1 shrink-0">
        <button
          aria-label="Edit variant"
          onClick={() => onEdit(variant)}
          className="h-7 w-7 flex items-center justify-center rounded text-foreground-muted hover:bg-muted hover:text-foreground transition-colors"
        >
          <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button
          aria-label="Delete variant"
          onClick={() => onDelete(variant)}
          className="h-7 w-7 flex items-center justify-center rounded text-foreground-muted hover:bg-danger/10 hover:text-danger transition-colors"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Variant form dialog ───────────────────────────────────────────────────────

interface VariantFormState {
  sku: string;
  priceOverride: string;
  sortOrder: string;
  isActive: boolean;
  attributeValueIds: string;
}

const emptyVariantForm: VariantFormState = {
  sku: "",
  priceOverride: "",
  sortOrder: "0",
  isActive: true,
  attributeValueIds: "",
};

function variantToForm(v: VariantResponse): VariantFormState {
  return {
    sku: v.sku ?? "",
    priceOverride: v.priceOverride != null ? String(v.priceOverride) : "",
    sortOrder: String(v.sortOrder),
    isActive: v.isActive,
    attributeValueIds: v.attributeValueIds ?? "",
  };
}

interface VariantEditorProps {
  productId: string;
  variants: VariantResponse[];
  onRefresh: () => void;
}

function VariantEditor({ productId, variants, onRefresh }: VariantEditorProps) {
  const [editTarget, setEditTarget] = useState<VariantResponse | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState<VariantFormState>(emptyVariantForm);
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<VariantResponse | null>(null);
  const [deleting, setDeleting] = useState(false);

  function openNew() {
    setIsNew(true);
    setEditTarget(null);
    setForm(emptyVariantForm);
    setFormErrors({});
    setApiError("");
  }

  function openEdit(v: VariantResponse) {
    setIsNew(false);
    setEditTarget(v);
    setForm(variantToForm(v));
    setFormErrors({});
    setApiError("");
  }

  function closeEditor() {
    setIsNew(false);
    setEditTarget(null);
    setForm(emptyVariantForm);
  }

  function validate() {
    const e: Record<string, string> = {};
    const price = parseFloat(form.priceOverride);
    if (form.priceOverride !== "" && (isNaN(price) || price < 0))
      e.priceOverride = "Price override must be a non-negative number.";
    const sort = parseInt(form.sortOrder);
    if (isNaN(sort) || sort < 0)
      e.sortOrder = "Sort order must be a non-negative integer.";
    return e;
  }

  async function handleSave() {
    const errs = validate();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setFormErrors({});
    setApiError("");
    setSaving(true);

    // attributeValueIds: API expects string[] (array of UUIDs) in the request
    const attrIds = form.attributeValueIds.trim()
      ? form.attributeValueIds.split(",").map((s) => s.trim()).filter(Boolean)
      : undefined;

    const createPayload: CreateVariantRequest = {
      sku: form.sku.trim() || undefined,
      priceOverride: form.priceOverride !== "" ? parseFloat(form.priceOverride) : undefined,
      sortOrder: parseInt(form.sortOrder),
      attributeValueIds: attrIds,
    };

    const updatePayload: UpdateVariantRequest = {
      ...createPayload,
      isActive: form.isActive,
    };

    const res = isNew
      ? await adminVariantsApi.create(productId, createPayload)
      : await adminVariantsApi.update(productId, editTarget!.id, updatePayload);

    setSaving(false);
    if (res.ok) {
      closeEditor();
      onRefresh();
    } else {
      setApiError(
        res.error && "message" in res.error ? res.error.message : "Failed to save variant.",
      );
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    await adminVariantsApi.delete(productId, deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
    onRefresh();
  }

  const showEditor = isNew || editTarget !== null;

  return (
    <div className="flex flex-col gap-3">
      {variants.length === 0 && !showEditor && (
        <p className="text-body-sm text-foreground-muted">No variants yet. Add a variant to offer size/color options.</p>
      )}

      {/* Variant list */}
      <div className="flex flex-col gap-2">
        {variants.map((v) => (
          <VariantRow
            key={v.id}
            variant={v}
            onEdit={openEdit}
            onDelete={() => setDeleteTarget(v)}
          />
        ))}
      </div>

      {/* Inline editor */}
      {showEditor && (
        <div className="rounded-lg border border-border bg-surface-elevated p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-body-sm font-semibold text-foreground">
              {isNew ? "New Variant" : "Edit Variant"}
            </p>
            <button onClick={closeEditor} aria-label="Close" className="h-7 w-7 flex items-center justify-center rounded text-foreground-muted hover:bg-muted">
              <X className="size-4" />
            </button>
          </div>

          {apiError && (
            <p role="alert" className="text-body-sm text-danger bg-danger/5 border border-danger/20 rounded-md px-4 py-3">
              {apiError}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="SKU"
              value={form.sku}
              onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
              placeholder="e.g. PROD-001-M-RED"
            />
            <Input
              label="Price override (optional)"
              type="number"
              min={0}
              step={0.01}
              value={form.priceOverride}
              onChange={(e) => setForm((f) => ({ ...f, priceOverride: e.target.value }))}
              placeholder="Leave blank to inherit"
              error={formErrors.priceOverride}
            />
            <Input
              label="Sort order"
              type="number"
              min={0}
              value={form.sortOrder}
              onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
              error={formErrors.sortOrder}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-body-sm font-medium text-foreground">Status</label>
              <select
                value={form.isActive ? "active" : "inactive"}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.value === "active" }))}
                aria-label="Variant status"
                className="h-9 px-3 rounded-md border border-border bg-background text-body-sm text-foreground focus:outline-none focus:ring-2 focus:ring-focus"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <Input
            label="Attribute value IDs (comma-separated UUIDs)"
            value={form.attributeValueIds}
            onChange={(e) => setForm((f) => ({ ...f, attributeValueIds: e.target.value }))}
            placeholder="e.g. uuid1,uuid2"
            hint="Comma-separated attribute value IDs for this variant combination."
          />

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={closeEditor} disabled={saving}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleSave} loading={saving}>Save Variant</Button>
          </div>
        </div>
      )}

      {!showEditor && (
        <Button variant="outline" size="sm" className="self-start" onClick={openNew}>
          <Plus className="size-3.5 mr-1.5" /> Add Variant
        </Button>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete variant"
        description={`Delete variant "${deleteTarget?.sku ?? deleteTarget?.id.slice(0, 8)}"? This cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        loading={deleting}
      />
    </div>
  );
}

// ── Main product form ─────────────────────────────────────────────────────────

interface ProductFormProps {
  /** Existing product for edit mode; null for create */
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
  const [variants, setVariants] = useState<VariantResponse[]>(product?.variants ?? []);

  const refreshVariants = useCallback(async () => {
    if (!productId) return;
    const res = await adminVariantsApi.list(productId);
    if (res.ok) setVariants(res.data);
    if (onRefresh) onRefresh();
  }, [productId, onRefresh]);

  function set<K extends keyof CreateProductRequest>(key: K, value: CreateProductRequest[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleNameChange(name: string) {
    setForm((f) => ({
      ...f,
      name,
      slug: f.slug ? f.slug : slugify(name),
    }));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name?.trim()) e.name = "Product name is required.";
    if (form.price < 0) e.price = "Price must be a non-negative number.";
    if (!form.price && form.price !== 0) e.price = "Price is required.";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setApiError("");
    setSaving(true);

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
      if (!isEdit) {
        router.push(`/admin/products/${res.data.id}`);
      } else {
        if (onRefresh) onRefresh();
        setApiError("");
      }
    } else {
      setApiError(
        res.error && "message" in res.error ? res.error.message : "Failed to save product.",
      );
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <AdminPageHeader
        title={isEdit ? (product.name ?? "Edit Product") : "New Product"}
        description={isEdit ? <AdminStatusBadge status={product.status ?? "Draft"} /> as unknown as string : undefined}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" type="button" onClick={() => router.push("/admin/products")}>
              Cancel
            </Button>
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

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content — 2 cols */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Section title="Basic Information">
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
              hint="URL-friendly identifier. Auto-generated from name if left blank."
            />
            <Input
              label="SKU"
              value={form.sku ?? ""}
              onChange={(e) => set("sku", e.target.value)}
              placeholder="e.g. PROD-001"
            />
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
                placeholder="Brief summary shown on product cards…"
              />
            </div>
          </Section>

          <Section title="Pricing">
            <div className="grid grid-cols-2 gap-4">
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
                label="Compare-at price (optional)"
                type="number"
                min={0}
                step={0.01}
                value={form.compareAtPrice ?? ""}
                onChange={(e) => set("compareAtPrice", e.target.value ? parseFloat(e.target.value) : undefined)}
              />
            </div>
          </Section>

          {/* Images — only for existing products */}
          {isEdit && productId && (
            <Section title="Images">
              <ImageManager
                productId={productId}
                images={product.images}
                onRefresh={() => { if (onRefresh) onRefresh(); }}
              />
            </Section>
          )}

          {/* Variants — only for existing products */}
          {isEdit && productId && (
            <Section title="Variants">
              <VariantEditor
                productId={productId}
                variants={variants}
                onRefresh={refreshVariants}
              />
            </Section>
          )}

          <Section title="SEO">
            <Input
              label="Meta title"
              value={form.metaTitle ?? ""}
              onChange={(e) => set("metaTitle", e.target.value)}
            />
            <Input
              label="Meta description"
              value={form.metaDescription ?? ""}
              onChange={(e) => set("metaDescription", e.target.value)}
            />
            <Input
              label="Meta keywords"
              value={form.metaKeywords ?? ""}
              onChange={(e) => set("metaKeywords", e.target.value)}
              hint="Comma-separated keywords."
            />
          </Section>
        </div>

        {/* Sidebar — 1 col */}
        <div className="flex flex-col gap-6">
          <Section title="Organisation">
            <div className="flex flex-col gap-1.5">
              <label className="text-body-sm font-medium text-foreground">Category</label>
              <select
                value={form.categoryId ?? ""}
                onChange={(e) => set("categoryId", e.target.value || undefined)}
                aria-label="Category"
                className="h-9 px-3 rounded-md border border-border bg-background text-body-sm text-foreground focus:outline-none focus:ring-2 focus:ring-focus"
              >
                <option value="">— No category —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
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
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </Section>

          <Section title="Settings">
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
          </Section>

          {!isEdit && (
            <div className="rounded-lg border border-border bg-surface p-4">
              <p className="text-caption text-foreground-muted">
                Images and variants can be added after saving the product.
              </p>
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
