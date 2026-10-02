"use client";

import { useEffect, useState, useCallback } from "react";
import { Copy, Check, CreditCard, ExternalLink } from "lucide-react";
import { adminIntegrationsApi } from "@/services/api/admin";
import { AdminPageHeader } from "@/features/admin/AdminPageHeader";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { extractApiError, cn } from "@/lib/utils";
import type { IntegrationStatusResponse } from "@/types/api";

function StatusBadge({ status }: { status: IntegrationStatusResponse | null }) {
  if (!status) return null;
  if (!status.isConfigured) return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-0.5 text-caption font-medium text-foreground-muted">
      <span className="h-1.5 w-1.5 rounded-full bg-foreground-muted" />Not Configured
    </span>
  );
  if (!status.enabled) return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/30 bg-warning/10 px-2.5 py-0.5 text-caption font-medium text-warning">
      <span className="h-1.5 w-1.5 rounded-full bg-warning" />Configured, Disabled
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2.5 py-0.5 text-caption font-medium text-success">
      <span className="h-1.5 w-1.5 rounded-full bg-success" />Active
    </span>
  );
}

function CopyButton({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  async function handleCopy() {
    try { await navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* ignore */ }
  }
  return (
    <button type="button" onClick={handleCopy} aria-label={`Copy ${label ?? "value"}`}
      className={cn("flex items-center gap-1.5 h-8 px-3 rounded-md text-body-sm border shrink-0 transition-colors",
        copied ? "border-success/30 bg-success/10 text-success" : "border-border text-foreground-muted hover:bg-muted hover:text-foreground")}>
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export function AdminPaymentIntegrationClient() {
  const [status, setStatus] = useState<IntegrationStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
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
      const d = res.data;
      setStatus(d);
      setEnabled(d.enabled);
      if (d.maskedKeyId) setKeyId(d.maskedKeyId);
    }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const webhookUrl = (status?.publicFields as Record<string, string> | null)?.webhookUrl ?? "";
  const suggestedWebhookSecret = !status?.hasSecret
    ? ((status?.publicFields as Record<string, string> | null)?.suggestedWebhookSecret ?? "")
    : "";

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaveError(""); setSaveSuccess(false);
    if (!keyId.trim()) { setSaveError("Key ID is required."); return; }
    if (!keySecret) { setSaveError("Key Secret is required."); return; }
    if (!webhookSecret) { setSaveError("Webhook Secret is required."); return; }
    setSaving(true);
    const res = await adminIntegrationsApi.updatePayment({ enabled, keyId: keyId.trim(), keySecret, webhookSecret });
    setSaving(false);
    if (res.ok) {
      await load(); setKeySecret(""); setWebhookSecret("");
      setSaveSuccess(true); setTimeout(() => setSaveSuccess(false), 4000);
    } else {
      setSaveError(extractApiError(res.error, "Failed to save payment settings."));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <AdminPageHeader title="Payment" description="Configure Razorpay for online payments. COD settings are in Shipping." />

      {/* Status row */}
      <div className="flex items-center gap-4 rounded-lg border border-border bg-background px-4 py-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
          <CreditCard className="size-5 text-foreground-muted" />
        </div>
        <div className="flex-1">
          <p className="text-body-sm font-semibold text-foreground">Razorpay</p>
          <p className="text-caption text-foreground-muted">Cards, UPI, net banking and wallets.</p>
        </div>
        {loading ? <Skeleton className="h-6 w-28 rounded-full" /> : <StatusBadge status={status} />}
      </div>

      {/* Webhook URL */}
      {!loading && webhookUrl && (
        <div className="rounded-lg border border-border bg-background p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-body-sm font-semibold text-foreground">Webhook URL</p>
            <a href="https://dashboard.razorpay.com/app/webhooks" target="_blank" rel="noopener noreferrer"
              className="text-caption text-foreground-muted underline underline-offset-2 hover:text-foreground inline-flex items-center gap-1">
              Razorpay Dashboard <ExternalLink className="size-3" />
            </a>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-body-sm font-mono bg-muted px-3 py-2 rounded-md border border-border truncate text-foreground">{webhookUrl}</code>
            <CopyButton value={webhookUrl} label="Webhook URL" />
          </div>
        </div>
      )}

      {/* Suggested webhook secret */}
      {!loading && suggestedWebhookSecret && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 flex flex-col gap-2">
          <p className="text-body-sm font-semibold text-foreground">Suggested Webhook Secret</p>
          <p className="text-caption text-foreground-muted">Use this when creating the webhook above, then enter it in the form below.</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-body-sm font-mono bg-background px-3 py-2 rounded-md border border-border truncate text-foreground">{suggestedWebhookSecret}</code>
            <CopyButton value={suggestedWebhookSecret} label="Webhook Secret" />
          </div>
        </div>
      )}

      {/* Credentials form — 2×2 grid */}
      <div className="rounded-lg border border-border bg-background p-4 flex flex-col gap-4">
        <h3 className="text-body-sm font-semibold text-foreground border-b border-border pb-2">Credentials</h3>

        {saveError && <p role="alert" className="text-body-sm text-danger bg-danger/5 border border-danger/20 rounded-md px-4 py-2">{saveError}</p>}
        {saveSuccess && <p className="text-body-sm text-success bg-success/5 border border-success/20 rounded-md px-4 py-2">Razorpay configuration saved.</p>}

        <form onSubmit={handleSave} noValidate className="flex flex-col gap-4">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
            <Input
              label="Key ID"
              value={keyId}
              onChange={(e) => setKeyId(e.target.value)}
              placeholder="rzp_live_…"
              hint={status?.maskedKeyId ? "Shown masked — enter new value to replace." : "From Dashboard → Settings → API Keys."}
              autoComplete="off"
              required
            />
            <Input
              label="Key Secret"
              type="password"
              value={keySecret}
              onChange={(e) => setKeySecret(e.target.value)}
              placeholder={status?.hasSecret ? "Configured — enter new to replace" : "Enter Key Secret"}
              hint="Write-only. Never shown after saving."
              autoComplete="new-password"
              required
            />
            <Input
              label="Webhook Secret"
              type="password"
              value={webhookSecret}
              onChange={(e) => setWebhookSecret(e.target.value)}
              placeholder={status?.hasSecret ? "Configured — enter new to replace" : suggestedWebhookSecret ? "Use suggested secret above" : "Enter webhook secret"}
              hint="Must match the secret set in Razorpay dashboard."
              autoComplete="new-password"
              required
            />
          </div>

          <div className="flex items-center justify-between gap-4 pt-1 border-t border-border">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="h-4 w-4 rounded border-border accent-primary" />
              <span className="text-body-sm font-medium text-foreground">Enable Razorpay Payments</span>
            </label>
            <Button type="submit" variant="primary" size="sm" loading={saving}>Save Configuration</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
