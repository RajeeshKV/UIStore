"use client";
import { extractApiError } from "@/lib/utils";

import { useEffect, useState, useCallback } from "react";
import { adminSettingsApi } from "@/services/api/admin";
import { AdminPageHeader } from "@/features/admin/AdminPageHeader";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import type { UpdateDeliverySettingsRequest } from "@/types/api";

export function AdminShippingClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<UpdateDeliverySettingsRequest>({
    flatFeeAmount: 0,
    freeShippingThreshold: undefined,
    codEnabled: false,
    codExtraFee: 0,
    processingDays: 1,
    minDeliveryDays: 3,
    maxDeliveryDays: 7,
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await adminSettingsApi.get();
    if (res.ok && res.data.delivery) {
      const d = res.data.delivery;
      setForm({
        flatFeeAmount: d.flatFeeAmount,
        freeShippingThreshold: d.freeShippingThreshold,
        codEnabled: d.codEnabled,
        codExtraFee: d.codExtraFee,
        processingDays: d.processingDays,
        minDeliveryDays: d.minDeliveryDays,
        maxDeliveryDays: d.maxDeliveryDays,
      });
    } else if (!res.ok) {
      setError(extractApiError(res.error, "Failed to load shipping settings."));
    }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError("");
    setSaveSuccess(false);
    const res = await adminSettingsApi.updateDelivery(form);
    setSaving(false);
    if (res.ok) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } else {
      setSaveError(extractApiError(res.error, "Failed to save shipping settings."));
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-64 w-full max-w-lg rounded-lg" />
      </div>
    );
  }

  if (error) {
    return <ErrorState title="Failed to load" description={error} onRetry={load} />;
  }

  function set<K extends keyof UpdateDeliverySettingsRequest>(key: K, value: UpdateDeliverySettingsRequest[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <form onSubmit={handleSave} noValidate className="flex flex-col gap-6">
      <AdminPageHeader
        title="Shipping"
        description="Delivery fees and COD configuration."
        action={
          <Button type="submit" variant="primary" size="sm" loading={saving}>
            Save Changes
          </Button>
        }
      />

      {saveError && (
        <p role="alert" className="text-body-sm text-danger bg-danger/5 border border-danger/20 rounded-md px-4 py-3 max-w-lg">{saveError}</p>
      )}
      {saveSuccess && (
        <p className="text-body-sm text-success bg-success/5 border border-success/20 rounded-md px-4 py-3 max-w-lg">Shipping settings saved.</p>
      )}

      <div className="rounded-lg border border-border bg-background p-6 flex flex-col gap-5 max-w-lg">
        <h3 className="text-body font-semibold text-foreground border-b border-border pb-3">Delivery Fees</h3>

        <Input
          label="Flat shipping fee"
          type="number"
          min={0}
          step={0.01}
          value={form.flatFeeAmount}
          onChange={(e) => set("flatFeeAmount", parseFloat(e.target.value) || 0)}
        />
        <Input
          label="Free shipping threshold (optional)"
          type="number"
          min={0}
          step={0.01}
          value={form.freeShippingThreshold ?? ""}
          onChange={(e) => set("freeShippingThreshold", e.target.value ? parseFloat(e.target.value) : undefined)}
          hint="Orders above this amount get free shipping."
        />

        <h3 className="text-body font-semibold text-foreground border-b border-border pb-3 mt-2">Cash on Delivery</h3>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.codEnabled}
            onChange={(e) => set("codEnabled", e.target.checked)}
            className="h-4 w-4 rounded border-border accent-primary"
          />
          <span className="text-body-sm font-medium text-foreground">Enable COD</span>
        </label>

        {/* §1.8: only show/edit the COD fee input when COD is enabled.
            codExtraFee persists across disable/re-enable; hide it to avoid
            confusion about a non-zero fee on a disabled feature. */}
        {form.codEnabled && (
          <Input
            label="COD extra fee"
            type="number"
            min={0}
            step={0.01}
            value={form.codExtraFee}
            onChange={(e) => set("codExtraFee", parseFloat(e.target.value) || 0)}
          />
        )}

        <h3 className="text-body font-semibold text-foreground border-b border-border pb-3 mt-2">Delivery Timeline</h3>

        <div className="grid grid-cols-3 gap-3">
          <Input
            label="Processing days"
            type="number"
            min={0}
            value={form.processingDays}
            onChange={(e) => set("processingDays", parseInt(e.target.value) || 0)}
          />
          <Input
            label="Min delivery days"
            type="number"
            min={0}
            value={form.minDeliveryDays}
            onChange={(e) => set("minDeliveryDays", parseInt(e.target.value) || 0)}
          />
          <Input
            label="Max delivery days"
            type="number"
            min={0}
            value={form.maxDeliveryDays}
            onChange={(e) => set("maxDeliveryDays", parseInt(e.target.value) || 0)}
          />
        </div>
      </div>
    </form>
  );
}
