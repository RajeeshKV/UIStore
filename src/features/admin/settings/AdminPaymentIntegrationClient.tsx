"use client";
import { extractApiError } from "@/lib/utils";

import { useEffect, useState, useCallback } from "react";
import { CreditCard } from "lucide-react";
import { adminIntegrationsApi } from "@/services/api/admin";
import { AdminPageHeader } from "@/features/admin/AdminPageHeader";
import { AdminIntegrationCard } from "./AdminIntegrationCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { IntegrationStatusResponse } from "@/types/api";

export function AdminPaymentIntegrationClient() {
  const [status, setStatus] = useState<IntegrationStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Form — secrets never pre-filled
  const [keyId, setKeyId] = useState("");
  const [keySecret, setKeySecret] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await adminIntegrationsApi.getPayment();
    if (res.ok) {
      setStatus(res.data);
      setEnabled(res.data.enabled);
    }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError("");
    setSaveSuccess(false);
    const res = await adminIntegrationsApi.updatePayment({
      keyId: keyId.trim() || undefined,
      keySecret: keySecret || undefined,
      webhookSecret: webhookSecret || undefined,
      enabled,
    });
    setSaving(false);
    if (res.ok) {
      setStatus(res.data);
      setEnabled(res.data.enabled);
      setKeyId("");
      setKeySecret("");
      setWebhookSecret("");
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } else {
      setSaveError(extractApiError(res.error, "Failed to save payment settings."));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Payment"
        description="Razorpay integration for online payments."
      />

      <AdminIntegrationCard
        title="Razorpay"
        description="Accept payments via Razorpay."
        status={status}
        loading={loading}
        icon={<CreditCard className="size-5" />}
      >
        <form onSubmit={handleSave} noValidate className="flex flex-col gap-4">
          {saveError && (
            <p role="alert" className="text-body-sm text-danger bg-danger/5 border border-danger/20 rounded-md px-4 py-3">{saveError}</p>
          )}
          {saveSuccess && (
            <p className="text-body-sm text-success bg-success/5 border border-success/20 rounded-md px-4 py-3">Payment settings saved.</p>
          )}

          <div className="rounded-md bg-warning/5 border border-warning/20 px-4 py-3">
            <p className="text-caption text-warning">
              Enter new values to update credentials. Leave blank to keep existing configuration.
              Secrets are never shown after saving.
            </p>
          </div>

          <Input
            label="Key ID (public)"
            value={keyId}
            onChange={(e) => setKeyId(e.target.value)}
            placeholder={status?.maskedKeyId ? `Current: …${status.maskedKeyId}` : "rzp_live_…"}
            autoComplete="off"
          />
          <Input
            label="Key Secret"
            type="password"
            value={keySecret}
            onChange={(e) => setKeySecret(e.target.value)}
            placeholder={status?.hasSecret ? "Secret is configured — enter new value to update" : "Enter key secret"}
            autoComplete="new-password"
          />
          <Input
            label="Webhook Secret (optional)"
            type="password"
            value={webhookSecret}
            onChange={(e) => setWebhookSecret(e.target.value)}
            placeholder="Enter webhook secret to update"
            autoComplete="new-password"
          />

          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="h-4 w-4 rounded border-border accent-primary"
            />
            <span className="text-body-sm font-medium text-foreground">Enable Razorpay payments</span>
          </label>

          <Button type="submit" variant="primary" size="sm" loading={saving} className="self-start">
            Save Configuration
          </Button>
        </form>
      </AdminIntegrationCard>
    </div>
  );
}
