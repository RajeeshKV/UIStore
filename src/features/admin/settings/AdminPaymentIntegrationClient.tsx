"use client";

import { useEffect, useState, useCallback } from "react";
import { Copy, Check, CreditCard, ExternalLink, Banknote, Loader2 } from "lucide-react";
import { adminIntegrationsApi, adminSettingsApi } from "@/services/api/admin";
import { AdminPageHeader } from "@/features/admin/AdminPageHeader";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { extractApiError, cn } from "@/lib/utils";
import type { IntegrationStatusResponse } from "@/types/api";

// ── Status badge ──────────────────────────────────────────────────────────────

function PaymentStatusBadge({ status }: { status: IntegrationStatusResponse | null }) {
  if (!status) return null;
  const { isConfigured, enabled } = status;

  if (!isConfigured) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-0.5 text-caption font-medium text-foreground-muted">
        <span className="h-1.5 w-1.5 rounded-full bg-foreground-muted" />
        Not Configured
      </span>
    );
  }
  if (!enabled) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/30 bg-warning/10 px-2.5 py-0.5 text-caption font-medium text-warning">
        <span className="h-1.5 w-1.5 rounded-full bg-warning" />
        Configured, Disabled
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2.5 py-0.5 text-caption font-medium text-success">
      <span className="h-1.5 w-1.5 rounded-full bg-success" />
      Active
    </span>
  );
}

// ── Copy button ───────────────────────────────────────────────────────────────

function CopyButton({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={`Copy ${label ?? "value"}`}
      className={cn(
        "flex items-center gap-1.5 h-8 px-3 rounded-md text-body-sm border shrink-0 transition-colors",
        copied
          ? "border-success/30 bg-success/10 text-success"
          : "border-border text-foreground-muted hover:bg-muted hover:text-foreground",
      )}
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

// ── Read-only URL row ─────────────────────────────────────────────────────────

function ReadOnlyRow({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-body-sm font-medium text-foreground">{label}</label>
      <div className="flex items-center gap-2">
        <code className="flex-1 text-body-sm font-mono bg-muted px-3 py-2 rounded-md border border-border truncate text-foreground">
          {value}
        </code>
        <CopyButton value={value} label={label} />
      </div>
      {hint && <p className="text-caption text-foreground-muted">{hint}</p>}
    </div>
  );
}

// ── Toggle switch ─────────────────────────────────────────────────────────────

function ToggleSwitch({
  id,
  checked,
  onChange,
  disabled,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-transparent",
        "transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        checked ? "bg-primary" : "bg-border-strong",
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200",
          checked ? "translate-x-5" : "translate-x-0.5",
        )}
      />
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function AdminPaymentIntegrationClient() {
  const [status, setStatus] = useState<IntegrationStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Razorpay credentials — secrets always blank (write-only)
  const [keyId, setKeyId] = useState("");
  const [keySecret, setKeySecret] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // COD toggle
  const [codEnabled, setCodEnabled] = useState(false);
  const [codLoading, setCodLoading] = useState(true);
  const [codSaving, setCodSaving] = useState(false);
  const [codError, setCodError] = useState("");
  const [codSuccess, setCodSuccess] = useState(false);

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

  // Load COD state from admin settings (delivery.codEnabled is the source of truth)
  const loadCod = useCallback(async () => {
    setCodLoading(true);
    const res = await adminSettingsApi.get();
    if (res.ok) {
      setCodEnabled(res.data.delivery?.codEnabled ?? false);
    }
    setCodLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { void loadCod(); }, [loadCod]);

  const webhookUrl = (status?.publicFields as Record<string, string> | null)?.webhookUrl ?? "";
  const suggestedWebhookSecret = !status?.hasSecret
    ? ((status?.publicFields as Record<string, string> | null)?.suggestedWebhookSecret ?? "")
    : "";

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaveError("");
    setSaveSuccess(false);

    if (!keyId.trim()) { setSaveError("Key ID is required."); return; }
    if (!keySecret) { setSaveError("Key Secret is required."); return; }
    if (!webhookSecret) { setSaveError("Webhook Secret is required."); return; }

    setSaving(true);
    const res = await adminIntegrationsApi.updatePayment({
      enabled,
      keyId: keyId.trim(),
      keySecret,
      webhookSecret,
    });
    setSaving(false);
    if (res.ok) {
      await load();
      setKeySecret("");
      setWebhookSecret("");
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } else {
      setSaveError(extractApiError(res.error, "Failed to save payment settings."));
    }
  }

  async function handleCodToggle(next: boolean) {
    setCodError("");
    setCodSuccess(false);
    setCodSaving(true);
    const res = await adminIntegrationsApi.updateCod(next);
    setCodSaving(false);
    if (res.ok) {
      setCodEnabled(next);
      setCodSuccess(true);
      setTimeout(() => setCodSuccess(false), 3000);
    } else {
      setCodError(extractApiError(res.error, "Failed to update COD setting."));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader title="Payment" description="Configure online payments and cash on delivery." />

      {/* ── Razorpay card ── */}
      <div className="rounded-lg border border-border bg-background overflow-hidden max-w-2xl">
        {/* Header with status */}
        <div className="flex items-center gap-4 border-b border-border px-6 py-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
            <CreditCard className="size-5 text-foreground-muted" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-body font-semibold text-foreground">Razorpay</p>
            <p className="text-caption text-foreground-muted">Accept cards, UPI, net banking and wallets.</p>
          </div>
          {loading ? <Skeleton className="h-6 w-28 rounded-full" /> : <PaymentStatusBadge status={status} />}
        </div>

        <div className="px-6 py-5 flex flex-col gap-6">

          {/* Section 1 — Webhook URL */}
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="text-body font-semibold text-foreground">Setup Instructions</h3>
              <p className="text-caption text-foreground-muted mt-1">
                Add the webhook URL in{" "}
                <a
                  href="https://dashboard.razorpay.com/app/webhooks"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-foreground inline-flex items-center gap-0.5"
                >
                  Razorpay Dashboard → Settings → Webhooks → Add New Webhook
                  <ExternalLink className="size-3 ml-0.5" aria-hidden="true" />
                </a>
              </p>
            </div>

            {loading ? (
              <Skeleton className="h-10 w-full rounded-md" />
            ) : webhookUrl ? (
              <ReadOnlyRow
                label="Webhook URL"
                value={webhookUrl}
                hint="Paste this into the Razorpay webhook URL field."
              />
            ) : (
              <p className="text-caption text-foreground-muted">Webhook URL will appear after saving.</p>
            )}
          </div>

          {/* Section 2 — Suggested webhook secret */}
          {!loading && suggestedWebhookSecret && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 flex flex-col gap-3">
              <div className="flex items-start gap-2">
                <span className="text-primary text-body-sm mt-0.5">ℹ</span>
                <div>
                  <p className="text-body-sm font-semibold text-foreground">Suggested Webhook Secret</p>
                  <p className="text-caption text-foreground-muted mt-0.5">
                    Use this as the &quot;Secret&quot; when creating the webhook above.
                    Enter the same value in the Webhook Secret field below.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-body-sm font-mono bg-background px-3 py-2 rounded-md border border-border truncate text-foreground">
                  {suggestedWebhookSecret}
                </code>
                <CopyButton value={suggestedWebhookSecret} label="Webhook Secret" />
              </div>
            </div>
          )}

          {/* Section 3 — Credentials form */}
          <form onSubmit={handleSave} noValidate className="flex flex-col gap-4">
            <h3 className="text-body font-semibold text-foreground border-t border-border pt-4">Credentials</h3>

            {saveError && (
              <p role="alert" className="text-body-sm text-danger bg-danger/5 border border-danger/20 rounded-md px-4 py-3">{saveError}</p>
            )}
            {saveSuccess && (
              <p className="text-body-sm text-success bg-success/5 border border-success/20 rounded-md px-4 py-3">
                Razorpay configuration saved successfully.
              </p>
            )}

            <Input
              label="Key ID"
              value={keyId}
              onChange={(e) => setKeyId(e.target.value)}
              placeholder="rzp_live_…"
              hint={status?.maskedKeyId ? "Currently configured — shown masked. Enter a new value to replace." : "Your Razorpay Key ID from Dashboard → Settings → API Keys."}
              autoComplete="off"
              required
            />

            <Input
              label="Key Secret"
              type="password"
              value={keySecret}
              onChange={(e) => setKeySecret(e.target.value)}
              placeholder={status?.hasSecret ? "Secret configured — enter new value to replace" : "Enter your Razorpay Key Secret"}
              hint="Write-only. Never shown after saving."
              autoComplete="new-password"
              required
            />

            <Input
              label="Webhook Secret"
              type="password"
              value={webhookSecret}
              onChange={(e) => setWebhookSecret(e.target.value)}
              placeholder={status?.hasSecret ? "Configured — enter new value to replace" : suggestedWebhookSecret ? "Use the suggested secret above" : "Enter webhook secret"}
              hint="Must match the secret entered in Razorpay webhook settings."
              autoComplete="new-password"
              required
            />

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="h-4 w-4 rounded border-border accent-primary"
              />
              <div>
                <span className="text-body-sm font-medium text-foreground">Enable Razorpay Payments</span>
                <p className="text-caption text-foreground-muted">
                  {enabled ? "Customers can pay online." : "Online payments are disabled."}
                </p>
              </div>
            </label>

            <Button type="submit" variant="primary" size="sm" loading={saving} className="self-start">
              Save Configuration
            </Button>
          </form>
        </div>
      </div>

      {/* ── Cash on Delivery card ── */}
      <div className="rounded-lg border border-border bg-background overflow-hidden max-w-2xl">
        <div className="flex items-center gap-4 border-b border-border px-6 py-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
            <Banknote className="size-5 text-foreground-muted" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-body font-semibold text-foreground">Cash on Delivery</p>
            <p className="text-caption text-foreground-muted">Allow customers to pay when their order arrives.</p>
          </div>
          {/* Live status dot */}
          {codLoading ? (
            <Skeleton className="h-6 w-16 rounded-full" />
          ) : (
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-caption font-medium",
                codEnabled
                  ? "border-success/30 bg-success/10 text-success"
                  : "border-border bg-muted text-foreground-muted",
              )}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", codEnabled ? "bg-success" : "bg-foreground-muted")} />
              {codEnabled ? "Enabled" : "Disabled"}
            </span>
          )}
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">
          <p className="text-body-sm text-foreground-muted">
            COD is disabled by default for new stores. Enabling it allows customers to select
            &quot;Cash on Delivery&quot; at checkout. You can set the COD fee and eligibility in{" "}
            <a href="/admin/settings/delivery" className="underline underline-offset-2 hover:text-foreground">
              Delivery Settings
            </a>.
          </p>

          {codError && (
            <p role="alert" className="text-body-sm text-danger bg-danger/5 border border-danger/20 rounded-md px-4 py-3">
              {codError}
            </p>
          )}
          {codSuccess && (
            <p className="text-body-sm text-success bg-success/5 border border-success/20 rounded-md px-4 py-3">
              Cash on Delivery {codEnabled ? "enabled" : "disabled"} successfully.
            </p>
          )}

          {/* Toggle row */}
          <div className="flex items-center justify-between gap-4 p-4 rounded-lg border border-border bg-surface">
            <div>
              <p className="text-body-sm font-medium text-foreground">
                {codLoading ? "Loading…" : codEnabled ? "COD is enabled" : "COD is disabled"}
              </p>
              <p className="text-caption text-foreground-muted mt-0.5">
                {codEnabled
                  ? "Customers can choose to pay on delivery."
                  : "Customers must pay online at checkout."}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {codSaving && <Loader2 className="size-4 animate-spin text-foreground-muted" aria-label="Saving…" />}
              {codLoading ? (
                <Skeleton className="h-6 w-11 rounded-full" />
              ) : (
                <ToggleSwitch
                  id="cod-toggle"
                  checked={codEnabled}
                  onChange={handleCodToggle}
                  disabled={codSaving}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
