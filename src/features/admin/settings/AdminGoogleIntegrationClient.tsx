"use client";

import { useEffect, useState, useCallback } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
import { adminIntegrationsApi } from "@/services/api/admin";
import { AdminPageHeader } from "@/features/admin/AdminPageHeader";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { extractApiError, cn } from "@/lib/utils";
import type { IntegrationStatusResponse } from "@/types/api";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

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

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  async function handleCopy() {
    try { await navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* ignore */ }
  }
  return (
    <button type="button" onClick={handleCopy} aria-label="Copy to clipboard"
      className={cn("flex items-center gap-1.5 h-8 px-3 rounded-md text-body-sm border transition-colors shrink-0",
        copied ? "border-success/30 bg-success/10 text-success" : "border-border text-foreground-muted hover:bg-muted hover:text-foreground")}>
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export function AdminGoogleIntegrationClient() {
  const [status, setStatus] = useState<IntegrationStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await adminIntegrationsApi.getGoogle();
    if (res.ok) {
      const d = res.data;
      setStatus(d);
      setEnabled(d.enabled);
      if (d.maskedKeyId) setClientId(d.maskedKeyId);
      else if (d.publicFields?.clientId) setClientId(d.publicFields.clientId);
    }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const redirectUri = status?.publicFields?.redirectUri ?? "";

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setSaveError(""); setSaveSuccess(false);
    const res = await adminIntegrationsApi.updateGoogle({
      enabled,
      clientId: clientId.trim() || undefined,
      clientSecret: clientSecret.trim() || undefined,
    });
    setSaving(false);
    if (res.ok) {
      await load(); setClientSecret("");
      setSaveSuccess(true); setTimeout(() => setSaveSuccess(false), 3000);
    } else {
      setSaveError(extractApiError(res.error, "Failed to save Google OAuth settings."));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <AdminPageHeader title="Google OAuth" description="Enable Google sign-in for customers." />

      {/* Status row */}
      <div className="flex items-center gap-4 rounded-lg border border-border bg-background px-4 py-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
          <GoogleIcon />
        </div>
        <div className="flex-1">
          <p className="text-body-sm font-semibold text-foreground">Google OAuth 2.0</p>
          <p className="text-caption text-foreground-muted">Customers sign in with their Google account.</p>
        </div>
        {loading ? <Skeleton className="h-6 w-28 rounded-full" /> : <StatusBadge status={status} />}
      </div>

      {/* Redirect URI */}
      {!loading && redirectUri && (
        <div className="rounded-lg border border-border bg-background p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-body-sm font-semibold text-foreground">Authorized Redirect URI</p>
            <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer"
              className="text-caption text-foreground-muted underline underline-offset-2 hover:text-foreground inline-flex items-center gap-1">
              Google Cloud Console <ExternalLink className="size-3" />
            </a>
          </div>
          <p className="text-caption text-foreground-muted">Add this exact URL to your OAuth 2.0 client → Authorized redirect URIs.</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-body-sm font-mono bg-muted px-3 py-2 rounded-md border border-border truncate text-foreground">{redirectUri}</code>
            <CopyButton value={redirectUri} />
          </div>
        </div>
      )}

      {/* Credentials form */}
      <div className="rounded-lg border border-border bg-background p-4 flex flex-col gap-4">
        <h3 className="text-body-sm font-semibold text-foreground border-b border-border pb-2">Credentials</h3>

        {saveError && <p role="alert" className="text-body-sm text-danger bg-danger/5 border border-danger/20 rounded-md px-4 py-2">{saveError}</p>}
        {saveSuccess && <p className="text-body-sm text-success bg-success/5 border border-success/20 rounded-md px-4 py-2">Google OAuth settings saved.</p>}

        <form onSubmit={handleSave} noValidate className="flex flex-col gap-4">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            <Input
              label="Client ID"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="xxxxxx.apps.googleusercontent.com"
              hint={status?.isConfigured ? "Shown masked — enter new value to replace." : "Your Google OAuth 2.0 Client ID."}
              autoComplete="off"
            />
            <Input
              label="Client Secret"
              type="password"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              placeholder={status?.hasSecret ? "Configured — leave blank to keep, or type new to replace" : "Enter Client Secret"}
              hint="Write-only. Leave blank to keep the existing secret."
              autoComplete="new-password"
            />
          </div>

          <div className="flex items-center justify-between gap-4 pt-1 border-t border-border">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="h-4 w-4 rounded border-border accent-primary" />
              <span className="text-body-sm font-medium text-foreground">Enable Google OAuth</span>
            </label>
            <Button type="submit" variant="primary" size="sm" loading={saving}>Save Configuration</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
