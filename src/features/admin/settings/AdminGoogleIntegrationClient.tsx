"use client";

import { useEffect, useState, useCallback } from "react";
import { adminIntegrationsApi } from "@/services/api/admin";
import { AdminPageHeader } from "@/features/admin/AdminPageHeader";
import { AdminIntegrationCard } from "./AdminIntegrationCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
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
      setStatus(res.data);
      setEnabled(res.data.enabled);
      // publicFields may contain the clientId (public, safe to display)
      if (res.data.publicFields?.clientId) {
        setClientId(res.data.publicFields.clientId);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError("");
    setSaveSuccess(false);
    const res = await adminIntegrationsApi.updateGoogle({
      clientId: clientId.trim() || undefined,
      clientSecret: clientSecret || undefined,
      enabled,
    });
    setSaving(false);
    if (res.ok) {
      setStatus(res.data);
      setEnabled(res.data.enabled);
      setClientSecret("");
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } else {
      setSaveError(res.error && "message" in res.error ? res.error.message : "Failed to save Google settings.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Google OAuth"
        description="Enable Google sign-in for customers."
      />

      <AdminIntegrationCard
        title="Google OAuth"
        description="Allows customers to sign in using their Google account."
        status={status}
        loading={loading}
        icon={<GoogleIcon />}
      >
        <form onSubmit={handleSave} noValidate className="flex flex-col gap-4">
          {saveError && (
            <p role="alert" className="text-body-sm text-danger bg-danger/5 border border-danger/20 rounded-md px-4 py-3">{saveError}</p>
          )}
          {saveSuccess && (
            <p className="text-body-sm text-success bg-success/5 border border-success/20 rounded-md px-4 py-3">Google OAuth settings saved.</p>
          )}

          <div className="rounded-md bg-warning/5 border border-warning/20 px-4 py-3">
            <p className="text-caption text-warning">
              The Client ID is public and safe to display. The Client Secret is write-only and never shown after saving.
            </p>
          </div>

          <Input
            label="Client ID (public)"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            placeholder="xxxxxx.apps.googleusercontent.com"
            autoComplete="off"
          />
          <Input
            label="Client Secret"
            type="password"
            value={clientSecret}
            onChange={(e) => setClientSecret(e.target.value)}
            placeholder={status?.hasSecret ? "Secret configured — enter new value to update" : "Enter client secret"}
            autoComplete="new-password"
          />

          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="h-4 w-4 rounded border-border accent-primary"
            />
            <span className="text-body-sm font-medium text-foreground">Enable Google OAuth</span>
          </label>

          <Button type="submit" variant="primary" size="sm" loading={saving} className="self-start">
            Save Configuration
          </Button>
        </form>
      </AdminIntegrationCard>
    </div>
  );
}
