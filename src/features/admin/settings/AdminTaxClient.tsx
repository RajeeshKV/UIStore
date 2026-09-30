"use client";
import { extractApiError } from "@/lib/utils";

import { useEffect, useState, useCallback } from "react";
import { adminTaxApi } from "@/services/api/admin";
import { AdminPageHeader } from "@/features/admin/AdminPageHeader";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Toggle";
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
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !config) {
    return <ErrorState title="Failed to load" description={error ?? "Tax settings could not be loaded."} onRetry={load} />;
  }

  return (
    <form onSubmit={handleSave} noValidate className="flex flex-col gap-5">
      <AdminPageHeader
        title="Tax"
        description="Configure GST, VAT or any applicable tax for your store."
        action={
          <Button type="submit" variant="primary" size="sm" loading={saving}>
            Save Changes
          </Button>
        }
      />

      {saveError && (
        <p role="alert" className="text-body-sm text-danger bg-danger/5 border border-danger/20 rounded-lg px-4 py-3">
          {saveError}
        </p>
      )}
      {saveSuccess && (
        <p className="text-body-sm text-success bg-success/5 border border-success/20 rounded-lg px-4 py-3">
          Tax settings saved.
        </p>
      )}

      <div className="rounded-xl border border-border bg-background p-5 flex flex-col gap-5">
        {/* Enable row */}
        <Toggle
          id="tax-enabled"
          label="Enable tax"
          hint="Apply tax to all applicable orders."
          checked={form.taxEnabled}
          onChange={(v) => setForm((f) => ({ ...f, taxEnabled: v }))}
        />

        {form.taxEnabled && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 pt-1 border-t border-border">
            {/* Percentage + label side by side */}
            <div className="flex flex-col gap-1">
              <label className="text-caption font-medium text-foreground-muted uppercase tracking-wide">
                Rate (%)
              </label>
              <input
                type="text"
                inputMode="decimal"
                pattern="[0-9]*\.?[0-9]*"
                defaultValue={form.taxPercentage}
                key={form.taxPercentage}
                onBlur={(e) => {
                  const n = parseFloat(e.target.value);
                  if (!isNaN(n) && n >= 0 && n <= 100) setForm((f) => ({ ...f, taxPercentage: n }));
                  else e.target.value = String(form.taxPercentage);
                }}
                className="h-9 px-3 rounded-lg border border-border bg-background text-body-sm text-foreground
                           focus:outline-none focus:ring-2 focus:ring-focus
                           [appearance:textfield] [-moz-appearance:textfield]
                           [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
            </div>

            <Input
              label="Tax label"
              value={form.taxLabel ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, taxLabel: e.target.value }))}
              placeholder="e.g. GST, VAT, IGST"
            />

            <div className="sm:col-span-2">
              <Toggle
                id="tax-inclusive"
                label="Tax-inclusive pricing"
                hint="Product prices already include tax — tax is not added on top."
                checked={form.isPriceInclusive}
                onChange={(v) => setForm((f) => ({ ...f, isPriceInclusive: v }))}
              />
            </div>
          </div>
        )}
      </div>
    </form>
  );
}
