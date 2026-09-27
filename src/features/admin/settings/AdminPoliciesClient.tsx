"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, Globe } from "lucide-react";
import { adminPoliciesApi } from "@/services/api/admin";
import { AdminPageHeader } from "@/features/admin/AdminPageHeader";
import { AdminDialog, ConfirmDialog } from "@/features/admin/AdminDialog";
import { AdminStatusBadge } from "@/features/admin/AdminStatusBadge";
import { AdminTable, type Column } from "@/features/admin/AdminTable";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { StorePolicyResponse, UpsertStorePolicyRequest } from "@/types/api";

const POLICY_TYPES = [
  "PrivacyPolicy",
  "TermsAndConditions",
  "ShippingPolicy",
  "RefundPolicy",
  "CancellationPolicy",
  "ReturnPolicy",
];

const emptyForm: UpsertStorePolicyRequest = {
  policyType: "PrivacyPolicy",
  title: "",
  content: "",
  isPublished: false,
};

export function AdminPoliciesClient() {
  const [policies, setPolicies] = useState<StorePolicyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<StorePolicyResponse | null>(null);
  const [form, setForm] = useState<UpsertStorePolicyRequest>(emptyForm);
  const [apiError, setApiError] = useState("");
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<StorePolicyResponse | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await adminPoliciesApi.list();
    if (res.ok) {
      setPolicies(res.data);
    } else {
      setError(res.error && "message" in res.error ? res.error.message : "Failed to load policies.");
    }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  function openCreate() {
    setEditTarget(null);
    setForm(emptyForm);
    setApiError("");
    setDialogOpen(true);
  }

  function openEdit(policy: StorePolicyResponse) {
    setEditTarget(policy);
    setForm({
      // Backend field is 'policyType' — confirmed in API docs
      policyType: policy.policyType ?? "PrivacyPolicy",
      title: policy.title ?? "",
      content: policy.content ?? "",
      isPublished: policy.isPublished,
    });
    setApiError("");
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.policyType) return;
    setApiError("");
    setSaving(true);
    const res = await adminPoliciesApi.upsert(form);
    setSaving(false);
    if (res.ok) {
      setDialogOpen(false);
      void load();
    } else {
      setApiError(res.error && "message" in res.error ? res.error.message : "Failed to save policy.");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    await adminPoliciesApi.delete(deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
    void load();
  }

  const columns: Column<StorePolicyResponse>[] = [
    {
      key: "policy",
      header: "Policy",
      render: (row) => (
        <div>
          <p className="text-body-sm font-medium text-foreground">{row.title ?? row.policyType}</p>
          <p className="text-caption text-foreground-muted">{row.policyType}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <AdminStatusBadge
          status={row.isPublished ? "published" : "unpublished"}
          label={row.isPublished ? "Published" : "Draft"}
        />
      ),
    },
    {
      key: "updated",
      header: "Last updated",
      render: (row) => (
        <span className="text-body-sm text-foreground-muted whitespace-nowrap">
          {new Date(row.updatedAtUtc).toLocaleDateString("en-IN")}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-20",
      render: (row) => (
        <div className="flex gap-1">
          <button aria-label="Edit policy" onClick={() => openEdit(row)} className="h-7 w-7 flex items-center justify-center rounded text-foreground-muted hover:bg-muted hover:text-foreground transition-colors">
            <Pencil className="size-3.5" />
          </button>
          <button aria-label="Delete policy" onClick={() => setDeleteTarget(row)} className="h-7 w-7 flex items-center justify-center rounded text-foreground-muted hover:bg-danger/10 hover:text-danger transition-colors">
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
          title="Policies"
          description="Manage your store policies (privacy, terms, shipping, refund, etc.)."
          action={
            <Button variant="primary" size="sm" onClick={openCreate}>
              <Plus className="size-4 mr-1.5" /> New Policy
            </Button>
          }
        />
        <AdminTable
          columns={columns}
          rows={policies}
          rowKey={(r) => r.id}
          loading={loading}
          error={error}
          emptyTitle="No policies"
          emptyDescription="Add your store policies to build customer trust."
          onRetry={load}
        />
      </div>

      <AdminDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editTarget ? "Edit Policy" : "New Policy"}
        className="max-w-2xl"
      >
        <div className="flex flex-col gap-4">
          {apiError && (
            <p role="alert" className="text-body-sm text-danger bg-danger/5 border border-danger/20 rounded-md px-4 py-3">{apiError}</p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-body-sm font-medium text-foreground">Policy type</label>
              <select
                value={form.policyType ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, policyType: e.target.value }))}
                aria-label="Policy type"
                disabled={!!editTarget}
                className="h-9 px-3 rounded-md border border-border bg-background text-body-sm text-foreground focus:outline-none focus:ring-2 focus:ring-focus disabled:opacity-60"
              >
                {POLICY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <Input
              label="Title"
              value={form.title ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Privacy Policy"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-body-sm font-medium text-foreground">Content</label>
            <textarea
              value={form.content ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              rows={10}
              aria-label="Policy content"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-body-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-focus resize-y font-mono text-xs leading-relaxed"
              placeholder="Policy content (HTML or plain text)…"
            />
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))}
              className="h-4 w-4 rounded border-border accent-primary"
            />
            <div className="flex items-center gap-1.5">
              <Globe className="size-3.5 text-foreground-muted" />
              <span className="text-body-sm text-foreground">Published (visible to customers)</span>
            </div>
          </label>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleSave} loading={saving}>
              {editTarget ? "Save Changes" : "Create Policy"}
            </Button>
          </div>
        </div>
      </AdminDialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete policy"
        description={`Delete "${deleteTarget?.title ?? deleteTarget?.policyType}"? Customers will no longer be able to access this policy.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        loading={deleting}
      />
    </>
  );
}
