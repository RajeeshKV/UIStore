"use client";
import { extractApiError } from "@/lib/utils";
import { useEffect, useState, useCallback } from "react";
import { Mail } from "lucide-react";
import { adminIntegrationsApi, adminSettingsApi } from "@/services/api/admin";
import { AdminPageHeader } from "@/features/admin/AdminPageHeader";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import type { IntegrationStatusResponse, UpdateEmailSettingsRequest } from "@/types/api";

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

export function AdminEmailIntegrationClient() {
  const [status, setStatus] = useState<IntegrationStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const [apiKey, setApiKey] = useState("");
  const [integEnabled, setIntegEnabled] = useState(false);
  const [integSaving, setIntegSaving] = useState(false);
  const [integError, setIntegError] = useState("");
  const [integSuccess, setIntegSuccess] = useState(false);

  const [emailSettings, setEmailSettings] = useState<UpdateEmailSettingsRequest>({
    mode: "", senderName: "", senderEmail: "",
  });
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsError, setSettingsError] = useState("");
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [integRes, settingsRes] = await Promise.all([
      adminIntegrationsApi.getEmail(),
      adminSettingsApi.get(),
    ]);
    if (integRes.ok) {
      setStatus(integRes.data);
      setIntegEnabled(integRes.data.enabled);
    }
    if (settingsRes.ok && settingsRes.data.email) {
      const e = settingsRes.data.email;
      setEmailSettings({ mode: e.mode ?? "", senderName: e.senderName ?? "", senderEmail: e.senderEmail ?? "" });
    }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function handleIntegrationSave(e: React.FormEvent) {
    e.preventDefault();
    setIntegSaving(true); setIntegError(""); setIntegSuccess(false);
    const res = await adminIntegrationsApi.updateEmail({ apiKey: apiKey || undefined, enabled: integEnabled });
    setIntegSaving(false);
    if (res.ok) {
      setStatus(res.data); setIntegEnabled(res.data.enabled); setApiKey("");
      setIntegSuccess(true); setTimeout(() => setIntegSuccess(false), 3000);
    } else {
      setIntegError(extractApiError(res.error, "Failed to save email integration."));
    }
  }

  async function handleSettingsSave(e: React.FormEvent) {
    e.preventDefault();
    setSettingsSaving(true); setSettingsError(""); setSettingsSuccess(false);
    const isKromicManaged = emailSettings.mode === "KromicManaged";
    const res = await adminSettingsApi.updateEmailSettings({
      mode: emailSettings.mode?.trim() || undefined,
      senderName: emailSettings.senderName?.trim() || undefined,
      senderEmail: isKromicManaged ? undefined : (emailSettings.senderEmail?.trim() || undefined),
    });
    setSettingsSaving(false);
    if (res.ok) { setSettingsSuccess(true); setTimeout(() => setSettingsSuccess(false), 3000); }
    else setSettingsError(extractApiError(res.error, "Failed to save email settings."));
  }

  return (
    <div className="flex flex-col gap-4">
      <AdminPageHeader title="Email" description="Transactional email configuration." />

      {/* Status row */}
      <div className="flex items-center gap-4 rounded-lg border border-border bg-background px-4 py-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Mail className="size-5 text-foreground-muted" />
        </div>
        <div className="flex-1">
          <p className="text-body-sm font-semibold text-foreground">Brevo</p>
          <p className="text-caption text-foreground-muted">Transactional emails for orders, OTPs and password resets.</p>
        </div>
        {loading ? <Skeleton className="h-6 w-28 rounded-full" /> : <StatusBadge status={status} />}
      </div>

      {/* Two panels side by side */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        {/* Panel 1: API key + enable */}
        <div className="rounded-lg border border-border bg-background p-4 flex flex-col gap-4">
          <h3 className="text-body-sm font-semibold text-foreground border-b border-border pb-2">Provider Credentials</h3>
          <p className="text-caption text-warning bg-warning/5 border border-warning/20 rounded-md px-3 py-2">
            API key is write-only — never shown after saving. Leave blank to keep the current key.
          </p>
          {integError && <p role="alert" className="text-body-sm text-danger bg-danger/5 border border-danger/20 rounded-md px-3 py-2">{integError}</p>}
          {integSuccess && <p className="text-body-sm text-success bg-success/5 border border-success/20 rounded-md px-3 py-2">Integration saved.</p>}
          <form onSubmit={handleIntegrationSave} noValidate className="flex flex-col gap-3">
            <Input
              label="Brevo API key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={status?.hasSecret ? "Configured — enter new value to update" : "Enter Brevo API key"}
              autoComplete="new-password"
            />
            <div className="flex items-center justify-between gap-4 pt-1 border-t border-border">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" checked={integEnabled} onChange={(e) => setIntegEnabled(e.target.checked)} className="h-4 w-4 rounded border-border accent-primary" />
                <span className="text-body-sm font-medium text-foreground">Enable email sending</span>
              </label>
              <Button type="submit" variant="primary" size="sm" loading={integSaving}>Save</Button>
            </div>
          </form>
        </div>

        {/* Panel 2: Sender settings */}
        <div className="rounded-lg border border-border bg-background p-4 flex flex-col gap-4">
          <h3 className="text-body-sm font-semibold text-foreground border-b border-border pb-2">Sender Settings</h3>
          {settingsError && <p role="alert" className="text-body-sm text-danger bg-danger/5 border border-danger/20 rounded-md px-3 py-2">{settingsError}</p>}
          {settingsSuccess && <p className="text-body-sm text-success bg-success/5 border border-success/20 rounded-md px-3 py-2">Sender settings saved.</p>}
          <form onSubmit={handleSettingsSave} noValidate className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-body-sm font-medium text-foreground">Mode</label>
              <select
                value={emailSettings.mode ?? ""}
                onChange={(e) => setEmailSettings((f) => ({ ...f, mode: e.target.value }))}
                aria-label="Email mode"
                className="h-9 px-3 rounded-md border border-border bg-background text-body-sm text-foreground focus:outline-none focus:ring-2 focus:ring-focus"
              >
                <option value="">— Select mode —</option>
                <option value="KromicManaged">KromicManaged — Shopey handles delivery</option>
                <option value="CustomerBrevo">CustomerBrevo — Your own Brevo account</option>
              </select>
            </div>
            <div className={cn("grid gap-3", emailSettings.mode !== "KromicManaged" ? "grid-cols-2" : "grid-cols-1")}>
              <Input
                label="Sender name"
                value={emailSettings.senderName ?? ""}
                onChange={(e) => setEmailSettings((f) => ({ ...f, senderName: e.target.value }))}
                placeholder="e.g. Shopey"
              />
              {emailSettings.mode !== "KromicManaged" && (
                <Input
                  label="Sender email"
                  type="email"
                  value={emailSettings.senderEmail ?? ""}
                  onChange={(e) => setEmailSettings((f) => ({ ...f, senderEmail: e.target.value }))}
                  placeholder="e.g. noreply@yourstore.com"
                  hint={emailSettings.mode === "CustomerBrevo" ? "Must be a valid domain email." : undefined}
                />
              )}
            </div>
            {emailSettings.mode === "KromicManaged" && (
              <p className="text-caption text-foreground-muted">Sender address is managed by Shopey in this mode.</p>
            )}
            <div className="flex justify-end pt-1 border-t border-border">
              <Button type="submit" variant="primary" size="sm" loading={settingsSaving}>Save</Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
