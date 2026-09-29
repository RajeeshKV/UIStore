"use client";
import { extractApiError } from "@/lib/utils";

import { useEffect, useState, useCallback } from "react";
import { adminTaxApi } from "@/services/api/admin";
import { AdminPageHeader } from "@/features/admin/AdminPageHeader";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import type { TaxConfigResponse, UpdateTaxConfigRequest } from "@/types/api";

export function AdminTaxClient() {
  const [config, setConfig] = useState<TaxConfigResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<UpdateTaxConfigRequest>({
    taxEnabled: false,
    taxPercentage: 0,
    isPriceInclusive: false,
    taxLabel: "",
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await adminTaxApi.get();
    if (res.ok) {
      setConfig(res.data);
      setForm({
        taxEnabled: res.data.taxEnabled,
        taxPercentage: res.data.taxPercentage,
        isPriceInclusive: res.data.isPriceInclusive,
        taxLabel: res.data.taxLabel ?? "",
      });
    } else {
      setError(extractApiError(res.error, "Failed to load tax settings."));
    }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError("");
    setSaveSuccess(false);
    const res = await adminTaxApi.update(form);
    setSaving(false);
    if (res.ok) {
      setConfig(res.data);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } else {
      setSaveError(extractApiError(res.error, "Failed to save tax settings."));
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-48 w-full max-w-lg rounded-lg" />
      </div>
    );
  }

  if (error || !config) {
    return <ErrorState title="Failed to load" description={error ?? "Tax settings could not be loaded."} onRetry={load} />;
  }

  return (
    <form onSubmit={handleSave} noValidate className="flex flex-col gap-6">
      <AdminPageHeader
        title="Tax"
        description="Configure tax rates for your store."
        action={
          <Button type="submit" variant="primary" size="sm" loading={saving}>
            Save Changes
          </Button>
        }
      />

      {saveError && (
        <p role="alert" className="text-body-sm text-danger bg-danger/5 border border-danger/20 rounded-md px-4 py-3 max-w-lg">
          {saveError}
        </p>
      )}
      {saveSuccess && (
        <p className="text-body-sm text-success bg-success/5 border border-success/20 rounded-md px-4 py-3 max-w-lg">
          Tax settings saved successfully.
        </p>
      )}

      <div className="rounded-lg border border-border bg-background p-6 flex flex-col gap-5 max-w-lg">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.taxEnabled}
            onChange={(e) => setForm((f) => ({ ...f, taxEnabled: e.target.checked }))}
            className="h-4 w-4 rounded border-border accent-primary"
          />
          <div>
            <span className="text-body-sm font-medium text-foreground">Enable tax</span>
            <p className="text-caption text-foreground-muted">Apply tax to orders.</p>
          </div>
        </label>

        <Input
          label="Tax percentage (%)"
          type="number"
          min={0}
          max={100}
          step={0.01}
          value={form.taxPercentage}
          onChange={(e) => setForm((f) => ({ ...f, taxPercentage: parseFloat(e.target.value) || 0 }))}
          disabled={!form.taxEnabled}
        />

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isPriceInclusive}
            onChange={(e) => setForm((f) => ({ ...f, isPriceInclusive: e.target.checked }))}
            disabled={!form.taxEnabled}
            className="h-4 w-4 rounded border-border accent-primary"
          />
          <div>
            <span className="text-body-sm font-medium text-foreground">Tax-inclusive pricing</span>
            <p className="text-caption text-foreground-muted">Product prices already include tax.</p>
          </div>
        </label>

        <Input
          label="Tax label (optional)"
          value={form.taxLabel ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, taxLabel: e.target.value }))}
          placeholder="e.g. GST, VAT"
          disabled={!form.taxEnabled}
        />
      </div>
    </form>
  );
}
