"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Plus, Pencil, Trash2, Upload, X } from "lucide-react";
import { adminBrandsApi } from "@/services/api/admin";
import { AdminPageHeader } from "@/features/admin/AdminPageHeader";
import { AdminTable, type Column } from "@/features/admin/AdminTable";
import { AdminDialog, ConfirmDialog } from "@/features/admin/AdminDialog";
import { AdminStatusBadge } from "@/features/admin/AdminStatusBadge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { extractApiError } from "@/lib/utils";
import type { BrandResponse, CreateBrandRequest } from "@/types/api";

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const emptyForm: CreateBrandRequest = {
  name: "", slug: "", description: "", websiteUrl: "",
};

// ── Inline logo upload for existing brands ────────────────────────────────────

function BrandLogoUpload({ brand, onRefresh }: { brand: BrandResponse; onRefresh: () => void }) {
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
    const res = await adminBrandsApi.uploadLogo(brand.id, fd);
    setUploading(false);
    if (res.ok) onRefresh();
    else setError(extractApiError(res.error, "Failed to upload logo."));
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleRemove() {
    setError("");
    setRemoving(true);
    const res = await adminBrandsApi.deleteLogo(brand.id);
    setRemoving(false);
    if (res.ok) onRefresh();
    else setError(extractApiError(res.error, "Failed to remove logo."));
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-body-sm font-medium text-foreground">Brand logo</label>
      <div className="flex items-center gap-3">
        {brand.logoUrl ? (
          <div className="relative group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={brand.logoUrl} alt={brand.name ?? ""} className="h-16 w-16 rounded-lg object-contain bg-surface border border-border p-1" />
            <button type="button" aria-label="Remove logo" onClick={handleRemove} disabled={removing} className="absolute -top-1 -right-1 hidden group-hover:flex h-5 w-5 items-center justify-center rounded-full bg-danger text-white disabled:opacity-60">
              <X className="size-2.5" />
            </button>
          </div>
        ) : (
          <div className="h-16 w-16 rounded-lg bg-muted border border-dashed border-border flex items-center justify-center">
            <Upload className="size-4 text-foreground-muted" />
          </div>
        )}
        <div className="flex flex-col gap-1">
          <input ref={inputRef} type="file" accept="image/*" aria-label="Upload brand logo" onChange={handleUpload} className="sr-only" id={`brand-logo-${brand.id}`} />
          <label htmlFor={`brand-logo-${brand.id}`} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-border text-body-sm text-foreground cursor-pointer hover:bg-muted transition-colors">
            {uploading ? "Uploading…" : brand.logoUrl ? "Replace" : "Upload logo"}
          </label>
          <p className="text-caption text-foreground-muted">PNG, JPG, SVG, WebP</p>
        </div>
      </div>
      {error && <p className="text-caption text-danger">{error}</p>}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function AdminBrandsClient() {
  const [brands, setBrands] = useState<BrandResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<BrandResponse | null>(null);
  const [form, setForm] = useState<CreateBrandRequest>(emptyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<BrandResponse | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await adminBrandsApi.list();
    if (res.ok) setBrands(res.data);
    else setError(extractApiError(res.error, "Failed to load brands."));
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

  function openEdit(brand: BrandResponse) {
    setEditTarget(brand);
    setForm({ name: brand.name ?? "", slug: brand.slug ?? "", description: brand.description ?? "", websiteUrl: brand.websiteUrl ?? "" });
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
    const payload: CreateBrandRequest = { ...form, slug: form.slug?.trim() || slugify(form.name ?? ""), description: form.description?.trim() || undefined, websiteUrl: form.websiteUrl?.trim() || undefined };
    const res = editTarget ? await adminBrandsApi.update(editTarget.id, payload) : await adminBrandsApi.create(payload);
    setSaving(false);
    if (res.ok) { setDialogOpen(false); void load(); }
    else setApiError(extractApiError(res.error, "Failed to save brand."));
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    await adminBrandsApi.delete(deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
    void load();
  }

  function handleLogoRefresh() {
    void load().then(() => {
      if (editTarget) {
        setBrands((prev) => {
          const updated = prev.find((b) => b.id === editTarget.id);
          if (updated) setEditTarget(updated);
          return prev;
        });
      }
    });
  }

  const columns: Column<BrandResponse>[] = [
    {
      key: "brand",
      header: "Brand",
      render: (row) => (
        <div className="flex items-center gap-3">
          {row.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={row.logoUrl} alt={row.name ?? ""} className="h-8 w-8 rounded object-contain bg-surface border border-border shrink-0" />
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
      key: "website",
      header: "Website",
      render: (row) => row.websiteUrl ? (
        <a href={row.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-body-sm text-foreground-muted hover:text-foreground underline truncate max-w-[180px] block">{row.websiteUrl}</a>
      ) : <span className="text-body-sm text-foreground-muted">—</span>,
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
          <button aria-label="Edit brand" onClick={() => openEdit(row)} className="h-7 w-7 flex items-center justify-center rounded text-foreground-muted hover:bg-muted hover:text-foreground transition-colors"><Pencil className="size-3.5" /></button>
          <button aria-label="Delete brand" onClick={() => setDeleteTarget(row)} className="h-7 w-7 flex items-center justify-center rounded text-foreground-muted hover:bg-danger/10 hover:text-danger transition-colors"><Trash2 className="size-3.5" /></button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="flex flex-col gap-6">
        <AdminPageHeader title="Brands" description={`${brands.length} brand${brands.length !== 1 ? "s" : ""}`} action={<Button variant="primary" size="sm" onClick={openCreate}><Plus className="size-4 mr-1.5" /> New Brand</Button>} />
        <AdminTable columns={columns} rows={brands} rowKey={(r) => r.id} loading={loading} error={error} emptyTitle="No brands" emptyDescription="Add your first brand." onRetry={load} />
      </div>

      <AdminDialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={editTarget ? "Edit Brand" : "New Brand"}>
        <div className="flex flex-col gap-4">
          {apiError && <p role="alert" className="text-body-sm text-danger bg-danger/5 border border-danger/20 rounded-md px-4 py-3">{apiError}</p>}
          <Input label="Name" required value={form.name ?? ""} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} error={formErrors.name} />
          <Input label="Slug" value={form.slug ?? ""} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} hint="Auto-generated from name if blank." />
          <Input label="Description" value={form.description ?? ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          <Input label="Website URL" type="url" value={form.websiteUrl ?? ""} onChange={(e) => setForm((f) => ({ ...f, websiteUrl: e.target.value }))} />
          {/* Logo upload — only for existing brands */}
          {editTarget && <BrandLogoUpload brand={editTarget} onRefresh={handleLogoRefresh} />}
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleSave} loading={saving}>{editTarget ? "Save Changes" : "Create Brand"}</Button>
          </div>
        </div>
      </AdminDialog>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete brand" description={`Delete "${deleteTarget?.name}"? Products using this brand will be unlinked.`} confirmLabel="Delete" confirmVariant="danger" loading={deleting} />
    </>
  );
}
