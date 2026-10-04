"use client";
import { extractApiError } from "@/lib/utils";
import { useEffect, useState, useCallback } from "react";
import { Mail } from "lucide-react";
import { adminIntegrationsApi, adminSettingsApi } from "@/services/api/admin";
import { AdminPageHeader } from "@/features/admin/AdminPageHeader";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
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

/**
 * Email integration — mode-first flow:
 * 1. Choose mode (KromicManaged | CustomerBrevo)
 * 2. Enable email sending (common to both modes)
 * 3. If CustomerBrevo: enter API key, sender name, sender email
 * 4. If KromicManaged: only sender name (Shopey manages the rest)
 *
 * Both integration credentials and display settings are saved in one action.
 */
export function AdminEmailIntegrationClient() {
  const [status, setStatus] = useState<IntegrationStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Unified form state
  const [mode, setMode]             = useState("");        // "" | "KromicManaged" | "CustomerBrevo"
  const [enabled, setEnabled]       = useState(false);
  const [apiKey, setApiKey]         = useState("");        // write-only, CustomerBrevo only
  const [senderName, setSenderName] = useState("");
  const [senderEmail, setSenderEmail] = useState("");      // CustomerBrevo only

  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [integRes, settingsRes] = await Promise.all([
      adminIntegrationsApi.getEmail(),
      adminSettingsApi.get(),
    ]);
    if (integRes.ok) {
      setStatus(integRes.data);
      setEnabled(integRes.data.enabled);
    }
    if (settingsRes.ok && settingsRes.data.email) {
      const e = settingsRes.data.email;
      setMode(e.mode ?? "");
      setSenderName(e.senderName ?? "");
      setSenderEmail(e.senderEmail ?? "");
    }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const isKromicManaged  = mode === "KromicManaged";
  const isCustomerBrevo  = mode === "CustomerBrevo";

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!mode) { setSaveError("Please select a mode before saving."); return; }
    setSaving(true); setSaveError(""); setSaveSuccess(false);

    // Save integration credentials (Brevo API key + enabled flag)
    const integRes = await adminIntegrationsApi.updateEmail({
      apiKey: (isCustomerBrevo && apiKey) ? apiKey : undefined,
      enabled,
    });

    if (!integRes.ok) {
      setSaving(false);
      setSaveError(extractApiError(integRes.error, "Failed to save email integration."));
      return;
    }

    // Save sender display settings
    const settingsRes = await adminSettingsApi.updateEmailSettings({
      mode: mode || undefined,
      senderName: senderName.trim() || undefined,
      // Omit senderEmail for KromicManaged — sending it is a 400
      senderEmail: isKromicManaged ? undefined : (senderEmail.trim() || undefined),
    });

    setSaving(false);
    if (settingsRes.ok) {
      setStatus(integRes.data);
      setEnabled(integRes.data.enabled);
      if (isCustomerBrevo) setApiKey(""); // clear write-only field
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } else {
      setSaveError(extractApiError(settingsRes.error, "Failed to save sender settings."));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <AdminPageHeader title="Email" description="Transactional email configuration." />

      {/* Status bar */}
      <div className="flex items-center gap-4 rounded-lg border border-border bg-background px-4 py-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Mail className="size-5 text-foreground-muted" />
        </div>
        <div className="flex-1">
          <p className="text-body-sm font-semibold text-foreground">Email (Brevo)</p>
          <p className="text-caption text-foreground-muted">Transactional emails for orders, OTPs and password resets.</p>
        </div>
        {loading ? <Skeleton className="h-6 w-28 rounded-full" /> : <StatusBadge status={status} />}
      </div>

      {/* Unified form */}
      <div className="rounded-lg border border-border bg-background p-4 flex flex-col gap-4">
        {saveError && <p role="alert" className="text-body-sm text-danger bg-danger/5 border border-danger/20 rounded-md px-3 py-2">{saveError}</p>}
        {saveSuccess && <p className="text-body-sm text-success bg-success/5 border border-success/20 rounded-md px-3 py-2">Email settings saved.</p>}

        <form onSubmit={handleSave} noValidate className="flex flex-col gap-4">

          {/* Step 1 — Mode selector (master control) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-body-sm font-medium text-foreground">
              Mode <span className="text-danger" aria-hidden="true">*</span>
            </label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              aria-label="Email mode"
              className="h-9 px-3 rounded-md border border-border bg-background text-body-sm text-foreground focus:outline-none focus:ring-2 focus:ring-focus"
            >
              <option value="">— Select mode —</option>
              <option value="KromicManaged">Kromic Managed — Shopey handles email delivery</option>
              <option value="CustomerBrevo">Your Brevo — use your own Brevo account</option>
            </select>
            {mode === "KromicManaged" && (
              <p className="text-caption text-foreground-muted">
                Shopey manages all email infrastructure. No API key needed.
              </p>
            )}
            {mode === "CustomerBrevo" && (
              <p className="text-caption text-foreground-muted">
                Emails are sent via your own Brevo account. Provide your API key and sender details below.
              </p>
            )}
          </div>

          {/* Step 2 — Enable toggle (common to both modes) */}
          {mode && (
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3">
              <div>
                <p className="text-body-sm font-medium text-foreground">Enable email sending</p>
                <p className="text-caption text-foreground-muted">
                  {enabled ? "Transactional emails will be sent." : "No emails will be sent while disabled."}
                </p>
              </div>
              <label className="relative inline-flex h-6 w-11 cursor-pointer items-center rounded-full transition-colors" aria-label="Enable email sending">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <span className="absolute inset-0 rounded-full bg-border peer-checked:bg-primary transition-colors" />
                <span className="relative h-4 w-4 rounded-full bg-white shadow transition-transform translate-x-1 peer-checked:translate-x-6" />
              </label>
            </div>
          )}

          {/* Step 3 — Credentials (CustomerBrevo only) */}
          {isCustomerBrevo && (
            <div className="flex flex-col gap-3">
              <p className="text-caption text-warning bg-warning/5 border border-warning/20 rounded-md px-3 py-2">
                API key is write-only — never shown after saving. Leave blank to keep the existing key.
              </p>
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
                <Input
                  label="Brevo API key"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={status?.hasSecret ? "Configured — enter new to replace" : "Enter Brevo API key"}
                  autoComplete="new-password"
                />
                <Input
                  label="Sender name"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="e.g. Shopey"
                />
                <Input
                  label="Sender email"
                  type="email"
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  placeholder="e.g. noreply@yourstore.com"
                  hint="Must be a verified domain on your Brevo account."
                />
              </div>
            </div>
          )}

          {/* Step 3 — KromicManaged: sender name only */}
          {isKromicManaged && (
            <div className="max-w-xs">
              <Input
                label="Sender name"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="e.g. Shopey"
                hint="Shown as the 'From' name in customer emails."
              />
            </div>
          )}

          {/* Save */}
          {mode && (
            <div className="flex justify-end pt-1 border-t border-border">
              <Button type="submit" variant="primary" size="sm" loading={saving}>
                Save Configuration
              </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
