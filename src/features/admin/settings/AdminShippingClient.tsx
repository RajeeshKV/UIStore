"use client";
import { extractApiError } from "@/lib/utils";
import { useEffect, useState, useCallback } from "react";
import { adminSettingsApi } from "@/services/api/admin";
import { AdminPageHeader } from "@/features/admin/AdminPageHeader";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Toggle";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import type { UpdateDeliverySettingsRequest } from "@/types/api";

function NumInput({
  label, hint, value, onChange, min, disabled, suffix,
}: {
  label: string; hint?: string; value: number | undefined; suffix?: string;
  onChange: (v: number | undefined) => void; min?: number; disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-body-sm font-medium text-foreground">{label}</label>
      <div className="flex items-center gap-1.5">
        <input
          type="text"
          inputMode="decimal"
          pattern="[0-9]*\.?[0-9]*"
          disabled={disabled}
          defaultValue={value ?? ""}
          key={value}
          onBlur={(e) => {
            const v = e.target.value.trim();
            if (v === "") { onChange(undefined); return; }
            const n = parseFloat(v);
            if (!isNaN(n) && (min === undefined || n >= min)) onChange(n);
            else e.target.value = value !== undefined ? String(value) : "";
          }}
          className="w-full h-9 px-3 rounded-lg border border-border bg-background text-body-sm text-foreground
                     placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-focus
                     disabled:opacity-40 disabled:pointer-events-none
                     [appearance:textfield] [-moz-appearance:textfield]
                     [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        {suffix && <span className="text-caption text-foreground-muted shrink-0">{suffix}</span>}
      </div>
      {hint && <p className="text-caption text-foreground-muted">{hint}</p>}
    </div>
  );
}

export function AdminShippingClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<UpdateDeliverySettingsRequest>({
    flatFeeAmount: 0, freeShippingThreshold: undefined,
    codEnabled: false, codExtraFee: 0,
    processingDays: 1, minDeliveryDays: 3, maxDeliveryDays: 7,
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    const res = await adminSettingsApi.get();
    if (res.ok && res.data.delivery) {
      const d = res.data.delivery;
      setForm({
        flatFeeAmount: d.flatFeeAmount, freeShippingThreshold: d.freeShippingThreshold,
        codEnabled: d.codEnabled, codExtraFee: d.codExtraFee,
        processingDays: d.processingDays, minDeliveryDays: d.minDeliveryDays, maxDeliveryDays: d.maxDeliveryDays,
      });
    } else if (!res.ok) {
      setError(extractApiError(res.error, "Failed to load shipping settings."));
    }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setSaveError(""); setSaveSuccess(false);
    const res = await adminSettingsApi.updateDelivery(form);
    setSaving(false);
    if (res.ok) { setSaveSuccess(true); setTimeout(() => setSaveSuccess(false), 3000); }
    else setSaveError(extractApiError(res.error, "Failed to save shipping settings."));
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-32" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-36 rounded-lg" />
          <Skeleton className="h-36 rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) return <ErrorState title="Failed to load" description={error} onRetry={load} />;

  function set<K extends keyof UpdateDeliverySettingsRequest>(key: K, value: UpdateDeliverySettingsRequest[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <form onSubmit={handleSave} noValidate className="flex flex-col gap-4">
      <AdminPageHeader
        title="Shipping"
        description="Delivery fees, free-shipping threshold, COD and delivery timeline."
        action={<Button type="submit" variant="primary" size="sm" loading={saving}>Save Changes</Button>}
      />

      {saveError && <p role="alert" className="text-body-sm text-danger bg-danger/5 border border-danger/20 rounded-md px-4 py-2">{saveError}</p>}
      {saveSuccess && <p className="text-body-sm text-success bg-success/5 border border-success/20 rounded-md px-4 py-2">Shipping settings saved.</p>}

      {/* Single row: all 4 sections side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

        {/* Delivery fees */}
        <div className="rounded-lg border border-border bg-background p-4 flex flex-col gap-3">
          <h3 className="text-body-sm font-semibold text-foreground border-b border-border pb-2">Delivery Fees</h3>
          <NumInput
            label="Flat shipping fee"
            value={form.flatFeeAmount}
            onChange={(v) => set("flatFeeAmount", v ?? 0)}
            min={0}
          />
          <NumInput
            label="Free shipping threshold"
            hint="Orders above this ship free."
            value={form.freeShippingThreshold}
            onChange={(v) => set("freeShippingThreshold", v)}
            min={0}
          />
        </div>

        {/* COD */}
        <div className="rounded-lg border border-border bg-background p-4 flex flex-col gap-3">
          <h3 className="text-body-sm font-semibold text-foreground border-b border-border pb-2">Cash on Delivery</h3>
          <Toggle
            id="cod-enabled"
            label="Enable COD"
            hint="Allow customers to pay cash on delivery."
            checked={form.codEnabled}
            onChange={(v) => set("codEnabled", v)}
          />
          {form.codEnabled && (
            <NumInput
              label="COD extra fee"
              hint="Added to order total."
              value={form.codExtraFee}
              onChange={(v) => set("codExtraFee", v ?? 0)}
              min={0}
            />
          )}
        </div>

        {/* Processing */}
        <div className="rounded-lg border border-border bg-background p-4 flex flex-col gap-3">
          <h3 className="text-body-sm font-semibold text-foreground border-b border-border pb-2">Processing</h3>
          <NumInput
            label="Processing days"
            value={form.processingDays}
            onChange={(v) => set("processingDays", v ?? 0)}
            min={0}
            suffix="d"
          />
        </div>

        {/* Delivery window */}
        <div className="rounded-lg border border-border bg-background p-4 flex flex-col gap-3">
          <h3 className="text-body-sm font-semibold text-foreground border-b border-border pb-2">Delivery Window</h3>
          <NumInput
            label="Minimum days"
            value={form.minDeliveryDays}
            onChange={(v) => set("minDeliveryDays", v ?? 0)}
            min={0}
            suffix="d"
          />
          <NumInput
            label="Maximum days"
            value={form.maxDeliveryDays}
            onChange={(v) => set("maxDeliveryDays", v ?? 0)}
            min={0}
            suffix="d"
          />
        </div>
      </div>
    </form>
  );
}
