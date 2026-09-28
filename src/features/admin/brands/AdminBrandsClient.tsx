"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { adminBrandsApi } from "@/services/api/admin";
import { AdminPageHeader } from "@/features/admin/AdminPageHeader";
import { AdminTable, type Column } from "@/features/admin/AdminTable";
import { AdminDialog, ConfirmDialog } from "@/features/admin/AdminDialog";
import { AdminStatusBadge } from "@/features/admin/AdminStatusBadge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { BrandResponse, CreateBrandRequest } from "@/types/api";

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const emptyForm: CreateBrandRequest = {
  name: "", slug: "", description: "", websiteUrl: "",
};

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
    if (res.ok) {
      setBrands(res.data);
    } else {
      setError(res.error && "message" in res.error ? res.error.message : "Failed to load brands.");
    }
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
    setForm({
      name: brand.name ?? "",
      slug: brand.slug ?? "",
      description: brand.description ?? "",
      websiteUrl: brand.websiteUrl ?? "",
    });
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

    const payload: CreateBrandRequest = {
      ...form,
      slug: form.slug?.trim() || slugify(form.name ?? ""),
      description: form.description?.trim() || undefined,
      websiteUrl: form.websiteUrl?.trim() || undefined,
    };

    const res = editTarget
      ? await adminBrandsApi.update(editTarget.id, payload)
      : await adminBrandsApi.create(payload);

    setSaving(false);
    if (res.ok) {
      setDialogOpen(false);
      void load();
    } else {
      setApiError(res.error && "message" in res.error ? res.error.message : "Failed to save brand.");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    await adminBrandsApi.delete(deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
    void load();
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
        <a href={row.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-body-sm text-foreground-muted hover:text-foreground underline truncate max-w-[180px] block">
          {row.websiteUrl}
        </a>
      ) : <span className="text-body-sm text-foreground-muted">—</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <AdminStatusBadge status={row.isActive ? "active" : "inactive"} label={row.isActive ? "Active" : "Inactive"} />
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-20",
      render: (row) => (
        <div className="flex gap-1">
          <button aria-label="Edit brand" onClick={() => openEdit(row)} className="h-7 w-7 flex items-center justify-center rounded text-foreground-muted hover:bg-muted hover:text-foreground transition-colors">
            <Pencil className="size-3.5" />
          </button>
          <button aria-label="Delete brand" onClick={() => setDeleteTarget(row)} className="h-7 w-7 flex items-center justify-center rounded text-foreground-muted hover:bg-danger/10 hover:text-danger transition-colors">
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
          title="Brands"
          description={`${brands.length} brand${brands.length !== 1 ? "s" : ""}`}
          action={
            <Button variant="primary" size="sm" onClick={openCreate}>
              <Plus className="size-4 mr-1.5" /> New Brand
            </Button>
          }
        />
        <AdminTable
          columns={columns}
          rows={brands}
          rowKey={(r) => r.id}
          loading={loading}
          error={error}
          emptyTitle="No brands"
          emptyDescription="Add your first brand."
          onRetry={load}
        />
      </div>

      <AdminDialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={editTarget ? "Edit Brand" : "New Brand"}>
        <div className="flex flex-col gap-4">
          {apiError && (
            <p role="alert" className="text-body-sm text-danger bg-danger/5 border border-danger/20 rounded-md px-4 py-3">{apiError}</p>
          )}
          <Input label="Name" required value={form.name ?? ""} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} error={formErrors.name} />
          <Input label="Slug" value={form.slug ?? ""} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} hint="Auto-generated from name if blank." />
          <Input label="Description" value={form.description ?? ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          <Input label="Website URL" type="url" value={form.websiteUrl ?? ""} onChange={(e) => setForm((f) => ({ ...f, websiteUrl: e.target.value }))} />
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleSave} loading={saving}>
              {editTarget ? "Save Changes" : "Create Brand"}
            </Button>
          </div>
        </div>
      </AdminDialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete brand"
        description={`Delete "${deleteTarget?.name}"? Products using this brand will be unlinked.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        loading={deleting}
      />
    </>
  );
}
