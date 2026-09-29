"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Plus, Pencil, Trash2, Upload, X } from "lucide-react";
import { adminCategoriesApi } from "@/services/api/admin";
import { AdminPageHeader } from "@/features/admin/AdminPageHeader";
import { AdminTable, type Column } from "@/features/admin/AdminTable";
import { AdminDialog, ConfirmDialog } from "@/features/admin/AdminDialog";
import { AdminStatusBadge } from "@/features/admin/AdminStatusBadge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { extractApiError } from "@/lib/utils";
import type { CategoryResponse, CreateCategoryRequest } from "@/types/api";

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const emptyForm: CreateCategoryRequest = {
  name: "", slug: "", description: "", parentCategoryId: undefined, sortOrder: 0,
};

// ── Inline image upload for existing categories ───────────────────────────────

function CategoryImageUpload({ category, onRefresh }: { category: CategoryResponse; onRefresh: () => void }) {
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await adminCategoriesApi.uploadImage(category.id, fd);
    setUploading(false);
    if (res.ok) onRefresh();
    else setError(extractApiError(res.error, "Failed to upload image."));
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleRemove() {
    setError("");
    setRemoving(true);
    const res = await adminCategoriesApi.deleteImage(category.id);
    setRemoving(false);
    if (res.ok) onRefresh();
    else setError(extractApiError(res.error, "Failed to remove image."));
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-body-sm font-medium text-foreground">Category image</label>
      <div className="flex items-center gap-3">
        {category.imageUrl ? (
          <div className="relative group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={category.imageUrl} alt={category.name ?? ""} className="h-16 w-16 rounded-lg object-cover bg-surface border border-border" />
            <button
              type="button"
              aria-label="Remove image"
              onClick={handleRemove}
              disabled={removing}
              className="absolute -top-1 -right-1 hidden group-hover:flex h-5 w-5 items-center justify-center rounded-full bg-danger text-white disabled:opacity-60"
            >
              <X className="size-2.5" />
            </button>
          </div>
        ) : (
          <div className="h-16 w-16 rounded-lg bg-muted border border-dashed border-border flex items-center justify-center">
            <Upload className="size-4 text-foreground-muted" />
          </div>
        )}
        <div className="flex flex-col gap-1">
          <input ref={inputRef} type="file" accept="image/*" aria-label="Upload category image" onChange={handleUpload} className="sr-only" id={`cat-img-${category.id}`} />
          <label
            htmlFor={`cat-img-${category.id}`}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-border text-body-sm text-foreground cursor-pointer hover:bg-muted transition-colors"
          >
            {uploading ? "Uploading…" : category.imageUrl ? "Replace" : "Upload image"}
          </label>
          <p className="text-caption text-foreground-muted">PNG, JPG, WebP</p>
        </div>
      </div>
      {error && <p className="text-caption text-danger">{error}</p>}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function AdminCategoriesClient() {
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CategoryResponse | null>(null);
  const [form, setForm] = useState<CreateCategoryRequest>(emptyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<CategoryResponse | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await adminCategoriesApi.list();
    if (res.ok) setCategories(res.data);
    else setError(extractApiError(res.error, "Failed to load categories."));
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  function openCreate() {
    setEditTarget(null);
    setForm(emptyForm);
    setFormErrors({});
    setApiError("");
    setDialogOpen(true);
  }

  function openEdit(cat: CategoryResponse) {
    setEditTarget(cat);
    setForm({ name: cat.name ?? "", slug: cat.slug ?? "", description: cat.description ?? "", parentCategoryId: cat.parentCategoryId, sortOrder: cat.sortOrder });
    setFormErrors({});
    setApiError("");
    setDialogOpen(true);
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name?.trim()) e.name = "Name is required.";
    return e;
  }

  async function handleSave() {
    const errs = validate();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setFormErrors({});
    setApiError("");
    setSaving(true);
    const payload: CreateCategoryRequest = {
      ...form,
      slug: form.slug?.trim() || slugify(form.name ?? ""),
      description: form.description?.trim() || undefined,
      parentCategoryId: form.parentCategoryId || undefined,
    };
    const res = editTarget
      ? await adminCategoriesApi.update(editTarget.id, payload)
      : await adminCategoriesApi.create(payload);
    setSaving(false);
    if (res.ok) {
      setDialogOpen(false);
      void load();
    } else {
      setApiError(extractApiError(res.error, "Failed to save category."));
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    await adminCategoriesApi.delete(deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
    void load();
  }

  // After image upload/remove, refresh the editTarget in the dialog
  function handleImageRefresh() {
    void load().then(() => {
      if (editTarget) {
        setCategories((prev) => {
          const updated = prev.find((c) => c.id === editTarget.id);
          if (updated) setEditTarget(updated);
          return prev;
        });
      }
    });
  }

  const columns: Column<CategoryResponse>[] = [
    {
      key: "name",
      header: "Name",
      render: (row) => (
        <div className="flex items-center gap-3">
          {row.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={row.imageUrl} alt={row.name ?? ""} className="h-8 w-8 rounded object-cover bg-surface border border-border shrink-0" />
          ) : (
            <div className="h-8 w-8 rounded bg-muted shrink-0" />
          )}
          <div>
            <p className="text-body-sm font-medium text-foreground">{row.name}</p>
            <p className="text-caption text-foreground-muted">{row.slug}</p>
          </div>
        </div>
      ),
    },
    {
      key: "parent",
      header: "Parent",
      render: (row) => <span className="text-body-sm text-foreground-muted">{row.parentCategoryName ?? "—"}</span>,
    },
    {
      key: "sort",
      header: "Sort",
      render: (row) => <span className="text-body-sm text-foreground-muted">{row.sortOrder}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <AdminStatusBadge status={row.isActive ? "active" : "inactive"} label={row.isActive ? "Active" : "Inactive"} />,
    },
    {
      key: "actions",
      header: "",
      className: "w-20",
      render: (row) => (
        <div className="flex gap-1">
          <button aria-label="Edit category" onClick={() => openEdit(row)} className="h-7 w-7 flex items-center justify-center rounded text-foreground-muted hover:bg-muted hover:text-foreground transition-colors">
            <Pencil className="size-3.5" />
          </button>
          <button aria-label="Delete category" onClick={() => setDeleteTarget(row)} className="h-7 w-7 flex items-center justify-center rounded text-foreground-muted hover:bg-danger/10 hover:text-danger transition-colors">
            <Trash2 className="size-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="flex flex-col gap-6">
        <AdminPageHeader
          title="Categories"
          description={`${categories.length} categor${categories.length !== 1 ? "ies" : "y"}`}
          action={<Button variant="primary" size="sm" onClick={openCreate}><Plus className="size-4 mr-1.5" /> New Category</Button>}
        />
        <AdminTable columns={columns} rows={categories} rowKey={(r) => r.id} loading={loading} error={error} emptyTitle="No categories" emptyDescription="Create your first category to organise products." onRetry={load} />
      </div>

      <AdminDialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={editTarget ? "Edit Category" : "New Category"}>
        <div className="flex flex-col gap-4">
          {apiError && <p role="alert" className="text-body-sm text-danger bg-danger/5 border border-danger/20 rounded-md px-4 py-3">{apiError}</p>}
          <Input label="Name" required value={form.name ?? ""} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} error={formErrors.name} />
          <Input label="Slug" value={form.slug ?? ""} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} hint="Auto-generated from name if blank." />
          <Input label="Description" value={form.description ?? ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          <div className="flex flex-col gap-1.5">
            <label className="text-body-sm font-medium text-foreground">Parent category</label>
            <select value={form.parentCategoryId ?? ""} onChange={(e) => setForm((f) => ({ ...f, parentCategoryId: e.target.value || undefined }))} aria-label="Parent category" className="h-9 px-3 rounded-md border border-border bg-background text-body-sm text-foreground focus:outline-none focus:ring-2 focus:ring-focus">
              <option value="">— None (top level) —</option>
              {categories.filter((c) => c.id !== editTarget?.id).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <Input label="Sort order" type="number" min={0} value={form.sortOrder ?? 0} onChange={(e) => setForm((f) => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))} />
          {/* Image upload — only for existing categories */}
          {editTarget && <CategoryImageUpload category={editTarget} onRefresh={handleImageRefresh} />}
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleSave} loading={saving}>{editTarget ? "Save Changes" : "Create Category"}</Button>
          </div>
        </div>
      </AdminDialog>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete category" description={`Delete "${deleteTarget?.name}"? Products in this category will be unlinked.`} confirmLabel="Delete" confirmVariant="danger" loading={deleting} />
    </>
  );
}
