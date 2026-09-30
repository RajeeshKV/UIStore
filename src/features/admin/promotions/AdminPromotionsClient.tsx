"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { Toggle } from "@/components/ui/Toggle";
import { adminPromotionsApi } from "@/services/api/admin";
import { AdminPageHeader } from "@/features/admin/AdminPageHeader";
import { AdminTable, type Column } from "@/features/admin/AdminTable";
import { AdminDialog, ConfirmDialog } from "@/features/admin/AdminDialog";
import { AdminStatusBadge } from "@/features/admin/AdminStatusBadge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { formatPrice , extractApiError } from "@/lib/utils";
import type { PromotionSummaryResponse, CreatePromotionRequest } from "@/types/api";

const PAGE_SIZE = 20;
const DISCOUNT_TYPES = ["Percentage", "FixedAmount"];
const APPLICABILITY = ["EntireOrder", "SpecificProducts", "SpecificCategories"];

const emptyForm: CreatePromotionRequest = {
  name: "",
  couponCode: "",
  discountType: "Percentage",
  discountValue: 0,
  applicability: "EntireOrder",
  isFirstOrderOnly: false,
  isActive: true,
};

export function AdminPromotionsClient() {
  const [promotions, setPromotions] = useState<PromotionSummaryResponse[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<CreatePromotionRequest>(emptyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<PromotionSummaryResponse | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [toggling, setToggling] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await adminPromotionsApi.list({ page, pageSize: PAGE_SIZE });
    if (res.ok) {
      const items = res.data.items;
      setPromotions(items);
      // Guard against inflated server metadata: if fewer items came back than
      // a full page, this must be the last page — cap totalPages accordingly.
      const serverPages = res.data.totalPages ?? 1;
      const cappedPages = items.length < PAGE_SIZE ? page : serverPages;
      setTotalPages(Math.max(1, cappedPages));
      // Use max of server totalCount and (page-1)*PAGE_SIZE + items.length
      // so the header count is never larger than what actually exists.
      const derivedCount = (page - 1) * PAGE_SIZE + items.length;
      const serverCount = res.data.totalCount ?? derivedCount;
      // If items < PAGE_SIZE this is the final page — derived count is exact.
      setTotalCount(items.length < PAGE_SIZE ? derivedCount : serverCount);
    } else {
      setError(extractApiError(res.error, "Failed to load promotions."));
    }
    setLoading(false);
  }, [page]);

  useEffect(() => { void load(); }, [load]);

  function openCreate() {
    setEditId(null);
    setForm(emptyForm);
    setFormErrors({});
    setApiError("");
    setDialogOpen(true);
  }

  async function openEdit(promo: PromotionSummaryResponse) {
    const res = await adminPromotionsApi.getById(promo.id);
    if (!res.ok) return;
    const d = res.data;
    setEditId(d.id);
    setForm({
      name: d.name ?? "",
      description: d.description ?? "",
      couponCode: d.couponCode ?? "",
      discountType: d.discountType ?? "Percentage",
      discountValue: d.discountValue,
      maxDiscountAmount: d.maxDiscountAmount,
      minimumOrderAmount: d.minimumOrderAmount,
      usageLimit: d.usageLimit,
      perCustomerUsageLimit: d.perCustomerUsageLimit,
      startsAt: d.startsAt ? d.startsAt.slice(0, 16) : "",
      expiresAt: d.expiresAt ? d.expiresAt.slice(0, 16) : "",
      applicability: d.applicability ?? "EntireOrder",
      isFirstOrderOnly: d.isFirstOrderOnly,
      isActive: d.isActive ?? true,
    });
    setFormErrors({});
    setApiError("");
    setDialogOpen(true);
  }

  function set<K extends keyof CreatePromotionRequest>(key: K, value: CreatePromotionRequest[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name?.trim()) e.name = "Name is required.";
    if (form.discountValue < 0) e.discountValue = "Discount value must be non-negative.";
    return e;
  }

  async function handleSave() {
    const errs = validate();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setFormErrors({});
    setApiError("");
    setSaving(true);

    const payload: CreatePromotionRequest = {
      ...form,
      couponCode: form.couponCode?.trim() || undefined,
      description: form.description?.trim() || undefined,
      startsAt: form.startsAt ? new Date(form.startsAt as string).toISOString() : undefined,
      expiresAt: form.expiresAt ? new Date(form.expiresAt as string).toISOString() : undefined,
    };

    const res = editId
      ? await adminPromotionsApi.update(editId, payload)
      : await adminPromotionsApi.create(payload);

    setSaving(false);
    if (res.ok) {
      setDialogOpen(false);
      void load();
    } else {
      setApiError(extractApiError(res.error, "Failed to save promotion."));
    }
  }

  async function handleToggle(promo: PromotionSummaryResponse) {
    setToggling(promo.id);
    const fn = promo.isActive ? adminPromotionsApi.deactivate : adminPromotionsApi.activate;
    await fn(promo.id);
    setToggling(null);
    void load();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError("");
    const res = await adminPromotionsApi.delete(deleteTarget.id);
    setDeleting(false);
    if (res.ok) {
      setDeleteTarget(null);
      void load();
    } else {
      // Keep dialog open and show the error (e.g. PROMOTION_ACTIVE)
      setDeleteError(extractApiError(res.error, "Failed to delete promotion."));
    }
  }

  const columns: Column<PromotionSummaryResponse>[] = [
    {
      key: "promo",
      header: "Promotion",
      render: (row) => (
        <div>
          <p className="text-body-sm font-medium text-foreground">{row.name}</p>
          {row.couponCode && (
            <code className="text-caption text-foreground-muted font-mono bg-muted px-1.5 py-0.5 rounded">
              {row.couponCode}
            </code>
          )}
        </div>
      ),
    },
    {
      key: "discount",
      header: "Discount",
      render: (row) => (
        <span className="text-body-sm text-foreground whitespace-nowrap">
          {row.discountType === "Percentage"
            ? `${row.discountValue}%`
            : formatPrice(row.discountValue, "INR")}
        </span>
      ),
    },
    {
      key: "usage",
      header: "Usage",
      render: (row) => (
        <span className="text-body-sm text-foreground-muted">
          {row.usageCount}{row.usageLimit != null ? ` / ${row.usageLimit}` : ""}
        </span>
      ),
    },
    {
      key: "validity",
      header: "Valid",
      render: (row) => (
        <span className="text-caption text-foreground-muted whitespace-nowrap">
          {row.startsAt ? new Date(row.startsAt).toLocaleDateString("en-IN") : "—"}
          {" – "}
          {row.expiresAt ? new Date(row.expiresAt).toLocaleDateString("en-IN") : "∞"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <AdminStatusBadge status={row.isActive ? "active" : "inactive"} />,
    },
    {
      key: "actions",
      header: "",
      className: "w-24",
      render: (row) => (
        <div className="flex gap-1">
          <button
            aria-label={row.isActive ? "Deactivate" : "Activate"}
            onClick={() => handleToggle(row)}
            disabled={toggling === row.id}
            className="h-7 w-7 flex items-center justify-center rounded text-foreground-muted hover:bg-muted hover:text-foreground transition-colors"
          >
            {row.isActive
              ? <ToggleRight className="size-4 text-success" />
              : <ToggleLeft className="size-4" />}
          </button>
          <button aria-label="Edit" onClick={() => openEdit(row)} className="h-7 w-7 flex items-center justify-center rounded text-foreground-muted hover:bg-muted hover:text-foreground transition-colors">
            <Pencil className="size-3.5" />
          </button>
          <button aria-label="Delete" onClick={() => setDeleteTarget(row)} className="h-7 w-7 flex items-center justify-center rounded text-foreground-muted hover:bg-danger/10 hover:text-danger transition-colors">
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
          title="Promotions"
          description={`${totalCount} promotion${totalCount !== 1 ? "s" : ""}`}
          action={
            <Button variant="primary" size="sm" onClick={openCreate}>
              <Plus className="size-4 mr-1.5" /> New Promotion
            </Button>
          }
        />
        <AdminTable
          columns={columns}
          rows={promotions}
          rowKey={(r) => r.id}
          loading={loading}
          error={error}
          emptyTitle="No promotions"
          emptyDescription="Create a coupon or discount promotion."
          onRetry={load}
        />
        {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />}
      </div>

      <AdminDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editId ? "Edit Promotion" : "New Promotion"}
        className="max-w-xl"
      >
        <div className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
          {apiError && (
            <p role="alert" className="text-body-sm text-danger bg-danger/5 border border-danger/20 rounded-md px-4 py-3">{apiError}</p>
          )}
          <Input label="Name" required value={form.name ?? ""} onChange={(e) => set("name", e.target.value)} error={formErrors.name} />
          <Input label="Description" value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} />
          <Input label="Coupon code (optional)" value={form.couponCode ?? ""} onChange={(e) => set("couponCode", e.target.value)} hint="Leave blank for automatic discount (no code required)." />

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-body-sm font-medium text-foreground">Discount type</label>
              <select value={form.discountType ?? "Percentage"} onChange={(e) => set("discountType", e.target.value)} aria-label="Discount type" className="h-9 px-3 rounded-md border border-border bg-background text-body-sm text-foreground focus:outline-none focus:ring-2 focus:ring-focus">
                {DISCOUNT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <Input label="Discount value" type="number" min={0} step={0.01} value={form.discountValue} onChange={(e) => set("discountValue", parseFloat(e.target.value) || 0)} error={formErrors.discountValue} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input label="Max discount amount (optional)" type="number" min={0} step={0.01} value={form.maxDiscountAmount ?? ""} onChange={(e) => set("maxDiscountAmount", e.target.value ? parseFloat(e.target.value) : undefined)} />
            <Input label="Min order amount (optional)" type="number" min={0} step={0.01} value={form.minimumOrderAmount ?? ""} onChange={(e) => set("minimumOrderAmount", e.target.value ? parseFloat(e.target.value) : undefined)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input label="Total usage limit (optional)" type="number" min={0} value={form.usageLimit ?? ""} onChange={(e) => set("usageLimit", e.target.value ? parseInt(e.target.value) : undefined)} />
            <Input label="Per-customer limit (optional)" type="number" min={0} value={form.perCustomerUsageLimit ?? ""} onChange={(e) => set("perCustomerUsageLimit", e.target.value ? parseInt(e.target.value) : undefined)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-body-sm font-medium text-foreground">Starts at (optional)</label>
              <input type="datetime-local" value={(form.startsAt as string) ?? ""} onChange={(e) => set("startsAt", e.target.value)} aria-label="Starts at" className="h-9 px-3 rounded-md border border-border bg-background text-body-sm text-foreground focus:outline-none focus:ring-2 focus:ring-focus" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-body-sm font-medium text-foreground">Expires at (optional)</label>
              <input type="datetime-local" value={(form.expiresAt as string) ?? ""} onChange={(e) => set("expiresAt", e.target.value)} aria-label="Expires at" className="h-9 px-3 rounded-md border border-border bg-background text-body-sm text-foreground focus:outline-none focus:ring-2 focus:ring-focus" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-body-sm font-medium text-foreground">Applicability</label>
            <select value={form.applicability ?? "EntireOrder"} onChange={(e) => set("applicability", e.target.value)} aria-label="Applicability" className="h-9 px-3 rounded-md border border-border bg-background text-body-sm text-foreground focus:outline-none focus:ring-2 focus:ring-focus">
              {APPLICABILITY.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-3 rounded-lg border border-border p-3">
            <Toggle
              id="promo-isActive"
              label="Active"
              hint="Inactive promotions are saved but not applied at checkout."
              checked={form.isActive ?? true}
              onChange={(v) => set("isActive", v)}
            />
            <Toggle
              id="promo-firstOrder"
              label="First order only"
              hint="Limit this promotion to customers placing their first order."
              checked={form.isFirstOrderOnly ?? false}
              onChange={(v) => set("isFirstOrderOnly", v)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleSave} loading={saving}>
              {editId ? "Save Changes" : "Create Promotion"}
            </Button>
          </div>
        </div>
      </AdminDialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => { setDeleteTarget(null); setDeleteError(""); }}
        onConfirm={handleDelete}
        title="Delete promotion"
        description={`Delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        loading={deleting}
      >
        {deleteError && (
          <p role="alert" className="text-body-sm text-danger bg-danger/5 border border-danger/20 rounded-lg px-3 py-2.5">
            {deleteError}
          </p>
        )}
      </ConfirmDialog>
    </>
  );
}
