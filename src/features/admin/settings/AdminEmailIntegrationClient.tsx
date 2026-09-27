"use client";

import { useEffect, useState, useCallback } from "react";
import { Mail } from "lucide-react";
import { adminIntegrationsApi, adminSettingsApi } from "@/services/api/admin";
import { AdminPageHeader } from "@/features/admin/AdminPageHeader";
import { AdminIntegrationCard } from "./AdminIntegrationCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { IntegrationStatusResponse, UpdateEmailSettingsRequest } from "@/types/api";

export function AdminEmailIntegrationClient() {
  const [status, setStatus] = useState<IntegrationStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Integration config (Brevo API key — write-only)
  const [apiKey, setApiKey] = useState("");
  const [integEnabled, setIntegEnabled] = useState(false);
  const [integSaving, setIntegSaving] = useState(false);
  const [integError, setIntegError] = useState("");
  const [integSuccess, setIntegSuccess] = useState(false);

  // Email display settings (PUT /api/v1/admin/settings/email)
  const [emailSettings, setEmailSettings] = useState<UpdateEmailSettingsRequest>({
    mode: "",
    senderName: "",
    senderEmail: "",
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
      setEmailSettings({
        mode: e.provider ?? "",
        senderName: "",
        senderEmail: e.fromEmail ?? "",
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function handleIntegrationSave(e: React.FormEvent) {
    e.preventDefault();
    setIntegSaving(true);
    setIntegError("");
    setIntegSuccess(false);
    const res = await adminIntegrationsApi.updateEmail({
      apiKey: apiKey || undefined,
      enabled: integEnabled,
    });
    setIntegSaving(false);
    if (res.ok) {
      setStatus(res.data);
      setIntegEnabled(res.data.enabled);
      setApiKey("");
      setIntegSuccess(true);
      setTimeout(() => setIntegSuccess(false), 3000);
    } else {
      setIntegError(res.error && "message" in res.error ? res.error.message : "Failed to save email integration.");
    }
  }

  async function handleSettingsSave(e: React.FormEvent) {
    e.preventDefault();
    setSettingsSaving(true);
    setSettingsError("");
    setSettingsSuccess(false);
    const res = await adminSettingsApi.updateEmailSettings({
      mode: emailSettings.mode?.trim() || undefined,
      senderName: emailSettings.senderName?.trim() || undefined,
      senderEmail: emailSettings.senderEmail?.trim() || undefined,
    });
    setSettingsSaving(false);
    if (res.ok) {
      setSettingsSuccess(true);
      setTimeout(() => setSettingsSuccess(false), 3000);
    } else {
      setSettingsError(res.error && "message" in res.error ? res.error.message : "Failed to save email settings.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Email"
        description="Transactional email configuration."
      />

      {/* Brevo integration */}
      <AdminIntegrationCard
        title="Email Provider (Brevo)"
        description="Transactional emails for orders, OTPs and password resets."
        status={status}
        loading={loading}
        icon={<Mail className="size-5" />}
      >
        <form onSubmit={handleIntegrationSave} noValidate className="flex flex-col gap-4">
          {integError && (
            <p role="alert" className="text-body-sm text-danger bg-danger/5 border border-danger/20 rounded-md px-4 py-3">{integError}</p>
          )}
          {integSuccess && (
            <p className="text-body-sm text-success bg-success/5 border border-success/20 rounded-md px-4 py-3">Email integration saved.</p>
          )}

          <div className="rounded-md bg-warning/5 border border-warning/20 px-4 py-3">
            <p className="text-caption text-warning">
              The API key is write-only and never shown after saving. Leave blank to keep the current key.
            </p>
          </div>

          <Input
            label="Brevo API key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={status?.hasSecret ? "Key configured — enter new value to update" : "Enter Brevo API key"}
            autoComplete="new-password"
          />

          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={integEnabled}
              onChange={(e) => setIntegEnabled(e.target.checked)}
              className="h-4 w-4 rounded border-border accent-primary"
            />
            <span className="text-body-sm font-medium text-foreground">Enable email sending</span>
          </label>

          <Button type="submit" variant="primary" size="sm" loading={integSaving} className="self-start">
            Save Integration
          </Button>
        </form>
      </AdminIntegrationCard>

      {/* Email display settings */}
      <div className="rounded-lg border border-border bg-background p-6 flex flex-col gap-4 max-w-2xl">
        <h3 className="text-body font-semibold text-foreground border-b border-border pb-3">Sender Settings</h3>
        <form onSubmit={handleSettingsSave} noValidate className="flex flex-col gap-4">
          {settingsError && (
            <p role="alert" className="text-body-sm text-danger bg-danger/5 border border-danger/20 rounded-md px-4 py-3">{settingsError}</p>
          )}
          {settingsSuccess && (
            <p className="text-body-sm text-success bg-success/5 border border-success/20 rounded-md px-4 py-3">Sender settings saved.</p>
          )}
          <Input
            label="Mode"
            value={emailSettings.mode ?? ""}
            onChange={(e) => setEmailSettings((f) => ({ ...f, mode: e.target.value }))}
            placeholder="e.g. smtp, api"
          />
          <Input
            label="Sender name"
            value={emailSettings.senderName ?? ""}
            onChange={(e) => setEmailSettings((f) => ({ ...f, senderName: e.target.value }))}
            placeholder="e.g. Kromic Store"
          />
          <Input
            label="Sender email"
            type="email"
            value={emailSettings.senderEmail ?? ""}
            onChange={(e) => setEmailSettings((f) => ({ ...f, senderEmail: e.target.value }))}
            placeholder="e.g. noreply@yourstore.com"
          />
          <Button type="submit" variant="primary" size="sm" loading={settingsSaving} className="self-start">
            Save Sender Settings
          </Button>
        </form>
      </div>
    </div>
  );
}
