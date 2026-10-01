"use client";

/**
 * Admin SMS Integration
 * =====================
 * Follows the exact same pattern as AdminEmailIntegrationClient:
 *  - AdminIntegrationCard for the integration status header
 *  - Provider dropdown loaded from GET /admin/integrations/sms/providers
 *  - providerSettings rendered as generic key/value fields (provider gives them)
 *  - OTP policy settings via PUT /admin/settings/auth (mobileOtpEnabled, timing)
 *  - SMS templates sub-section (CRUD table)
 *
 * Key constraint: PUT /admin/integrations/sms returns 204, not the status object.
 * Re-fetch getSms() after every save.
 *
 * Secrets: providerSettings values are write-only. Displayed as "Configured" when
 * the backend has them — never shown in plaintext (masked via hasSecret / publicFields).
 */

import { useEffect, useState, useCallback } from "react";
import { MessageSquare, Plus, Pencil, Trash2, X, Info, ChevronDown, ChevronUp } from "lucide-react";
import {
  adminIntegrationsApi,
  adminSmsApi,
  adminSettingsApi,
} from "@/services/api/admin";
import { AdminPageHeader } from "@/features/admin/AdminPageHeader";
import { AdminIntegrationCard } from "./AdminIntegrationCard";
import { AdminTable, type Column } from "@/features/admin/AdminTable";
import { ConfirmDialog } from "@/features/admin/AdminDialog";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { extractApiError, cn } from "@/lib/utils";
import type {
  IntegrationStatusResponse,
  SmsProviderOptionResponse,
  SmsTemplateResponse,
  CreateSmsTemplateRequest,
  UpdateSmsTemplateRequest,
} from "@/types/api";

// ── Provider instructions ─────────────────────────────────────────────────────
// Contextual help text per provider name. Keys must match backend provider names exactly.

const PROVIDER_INSTRUCTIONS: Record<string, React.ReactNode> = {
  Free2SMS: (
    <div className="rounded-md bg-blue-50 border border-blue-200 px-4 py-3 text-body-sm text-blue-800 flex flex-col gap-1.5">
      <p className="font-semibold flex items-center gap-1.5"><Info className="size-3.5" /> Free2SMS setup</p>
      <ul className="list-disc list-inside text-caption space-y-1">
        <li>Sign in at <strong>free2sms.com</strong> and go to Developer → API.</li>
        <li>Copy your <strong>API User ID</strong> and <strong>API Password</strong>.</li>
        <li>Register a <strong>Sender ID</strong> (6-character alphabetic, e.g. KROMIC).</li>
        <li>Create and register a <strong>DLT template</strong> for your OTP message on the TRAI DLT portal.</li>
        <li>Enter the DLT-approved template under SMS Templates below.</li>
        <li>The template body must include <code className="text-[11px] bg-muted px-1 rounded">{"{#var#}"}</code> where the code is inserted.</li>
      </ul>
    </div>
  ),
  Twilio: (
    <div className="rounded-md bg-purple-50 border border-purple-200 px-4 py-3 text-body-sm text-purple-800 flex flex-col gap-1.5">
      <p className="font-semibold flex items-center gap-1.5"><Info className="size-3.5" /> Twilio setup</p>
      <ul className="list-disc list-inside text-caption space-y-1">
        <li>Log in to <strong>console.twilio.com</strong>.</li>
        <li>Copy your <strong>Account SID</strong> and <strong>Auth Token</strong> from the dashboard.</li>
        <li>Obtain a Twilio phone number from <strong>Phone Numbers → Manage → Buy a number</strong>.</li>
        <li>Use the Twilio number (e.g. +15005550006) as the <strong>Sender ID</strong>.</li>
        <li>Note: Twilio delivery to India requires a supported trunk — verify your account has India coverage.</li>
      </ul>
    </div>
  ),
};

// Known field labels for common provider settings keys
const FIELD_LABELS: Record<string, { label: string; secret?: boolean; hint?: string }> = {
  apiKey:      { label: "API Key",      secret: true,  hint: "Write-only. Leave blank to keep the current key." },
  apiUserId:   { label: "API User ID",  secret: false },
  apiPassword: { label: "API Password", secret: true,  hint: "Write-only. Leave blank to keep the current password." },
  senderId:    { label: "Sender ID",    secret: false, hint: "Registered sender name (6 chars, e.g. KROMIC)." },
  accountSid:  { label: "Account SID",  secret: false },
  authToken:   { label: "Auth Token",   secret: true,  hint: "Write-only. Leave blank to keep the current token." },
  fromNumber:  { label: "From Number",  secret: false, hint: "E.164 format, e.g. +15005550006." },
  username:    { label: "Username",     secret: false },
  password:    { label: "Password",     secret: true,  hint: "Write-only." },
};

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-background p-6 flex flex-col gap-4 max-w-2xl">
      <h3 className="text-body font-semibold text-foreground border-b border-border pb-3">{title}</h3>
      {children}
    </div>
  );
}

// ── Template form ─────────────────────────────────────────────────────────────

interface TemplateFormState {
  provider: string;
  name: string;
  body: string;
  externalTemplateId: string;
  isActive: boolean;
}

const emptyTemplate = (provider?: string): TemplateFormState => ({
  provider: provider ?? "",
  name: "",
  body: "",
  externalTemplateId: "",
  isActive: true,
});

function templateFromResponse(t: SmsTemplateResponse): TemplateFormState {
  return {
    provider: t.provider ?? "",
    name: t.name ?? "",
    body: t.body ?? "",
    externalTemplateId: t.externalTemplateId ?? "",
    isActive: t.isActive,
  };
}

// ── Main component ────────────────────────────────────────────────────────────

export function AdminSmsIntegrationClient() {
  // ── Integration status + config ───────────────────────────────────────────
  const [status, setStatus] = useState<IntegrationStatusResponse | null>(null);
  const [providers, setProviders] = useState<SmsProviderOptionResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // Integration form state
  const [selectedProvider, setSelectedProvider] = useState("");
  const [providerSettings, setProviderSettings] = useState<Record<string, string>>({});
  const [integEnabled, setIntegEnabled] = useState(false);
  const [integSaving, setIntegSaving] = useState(false);
  const [integError, setIntegError] = useState("");
  const [integSuccess, setIntegSuccess] = useState(false);

  // ── OTP policy settings ───────────────────────────────────────────────────
  const [mobileOtpEnabled, setMobileOtpEnabled] = useState(false);
  const [otpExpiryMinutes, setOtpExpiryMinutes] = useState("10");
  const [otpResendCooldown, setOtpResendCooldown] = useState("60");
  const [otpMaxAttempts, setOtpMaxAttempts] = useState("5");
  const [policySaving, setPolicySaving] = useState(false);
  const [policyError, setPolicyError] = useState("");
  const [policySuccess, setPolicySuccess] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);

  // ── Templates ─────────────────────────────────────────────────────────────
  const [templates, setTemplates] = useState<SmsTemplateResponse[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesError, setTemplatesError] = useState<string | null>(null);
  const [templateFormOpen, setTemplateFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<SmsTemplateResponse | null>(null);
  const [templateForm, setTemplateForm] = useState<TemplateFormState>(emptyTemplate());
  const [templateSaving, setTemplateSaving] = useState(false);
  const [templateFormError, setTemplateFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<SmsTemplateResponse | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── Load everything on mount ──────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    const [smsRes, providersRes, settingsRes] = await Promise.all([
      adminIntegrationsApi.getSms(),
      adminSmsApi.getProviders(),
      adminSettingsApi.get(),
    ]);

    if (smsRes.ok) {
      setStatus(smsRes.data);
      setIntegEnabled(smsRes.data.enabled);
      // publicFields may carry the configured provider name
      if (smsRes.data.publicFields?.provider) {
        setSelectedProvider(smsRes.data.publicFields.provider);
      }
    }

    if (providersRes.ok) {
      setProviders(providersRes.data);
    }

    if (settingsRes.ok && settingsRes.data.auth) {
      const a = settingsRes.data.auth;
      setMobileOtpEnabled(a.mobileOtpEnabled);
      setOtpExpiryMinutes(String(a.otpExpiryMinutes ?? 10));
      setOtpResendCooldown(String(a.otpResendCooldownSeconds ?? 60));
      setOtpMaxAttempts(String(a.otpMaxAttempts ?? 5));
    }

    setLoading(false);
  }, []);

  const loadTemplates = useCallback(async () => {
    setTemplatesLoading(true);
    setTemplatesError(null);
    const res = await adminSmsApi.listTemplates();
    setTemplatesLoading(false);
    if (res.ok) {
      setTemplates(res.data);
    } else {
      setTemplatesError(extractApiError(res.error, "Failed to load templates."));
    }
  }, []);

  useEffect(() => {
    void load();
    void loadTemplates();
  }, [load, loadTemplates]);

  // ── Determine which provider-specific fields to show ──────────────────────
  // Since providerSettings is a generic Record<string,string>, we ask the
  // backend publicFields or fall back to common known keys per provider name.
  const knownFieldsByProvider: Record<string, string[]> = {
    Free2SMS: ["apiUserId", "apiPassword", "senderId"],
    Twilio:   ["accountSid", "authToken", "fromNumber"],
  };

  const fieldKeys: string[] = selectedProvider
    ? knownFieldsByProvider[selectedProvider] ?? ["apiKey", "senderId"]
    : [];

  // ── Save integration ──────────────────────────────────────────────────────
  async function handleIntegSave(e: React.FormEvent) {
    e.preventDefault();
    setIntegSaving(true);
    setIntegError("");
    setIntegSuccess(false);

    // Validate: cannot enable without a provider
    if (integEnabled && !selectedProvider) {
      setIntegError("Select a provider before enabling SMS integration.");
      setIntegSaving(false);
      return;
    }

    // Build providerSettings — only send non-empty values
    // (blank secret fields mean "keep existing" — do not overwrite)
    const settings: Record<string, string> = {};
    for (const key of fieldKeys) {
      const val = providerSettings[key];
      if (val && val.trim()) settings[key] = val.trim();
    }

    const res = await adminIntegrationsApi.updateSms({
      enabled: integEnabled,
      provider: selectedProvider || undefined,
      providerSettings: Object.keys(settings).length ? settings : undefined,
    });

    setIntegSaving(false);

    if (res.ok) {
      // PUT returns 204 — re-fetch to get updated status
      const refetch = await adminIntegrationsApi.getSms();
      if (refetch.ok) {
        setStatus(refetch.data);
        setIntegEnabled(refetch.data.enabled);
        if (refetch.data.publicFields?.provider) {
          setSelectedProvider(refetch.data.publicFields.provider);
        }
      }
      // Clear secret fields after save (write-only)
      const cleared: Record<string, string> = {};
      for (const key of fieldKeys) {
        const meta = FIELD_LABELS[key];
        if (meta?.secret) cleared[key] = "";
        else cleared[key] = providerSettings[key] ?? "";
      }
      setProviderSettings(cleared);
      setIntegSuccess(true);
      setTimeout(() => setIntegSuccess(false), 3000);
    } else {
      setIntegError(extractApiError(res.error, "Failed to save SMS integration."));
    }
  }

  // ── Save OTP policy ───────────────────────────────────────────────────────
  async function handlePolicySave(e: React.FormEvent) {
    e.preventDefault();
    setPolicySaving(true);
    setPolicyError("");
    setPolicySuccess(false);

    const res = await adminSettingsApi.updateAuth({
      mobileOtpEnabled,
      otpExpiryMinutes: parseInt(otpExpiryMinutes) || 10,
      otpResendCooldownSeconds: parseInt(otpResendCooldown) || 60,
      otpMaxAttempts: parseInt(otpMaxAttempts) || 5,
    });

    setPolicySaving(false);
    if (res.ok) {
      setPolicySuccess(true);
      setTimeout(() => setPolicySuccess(false), 3000);
    } else {
      setPolicyError(extractApiError(res.error, "Failed to save OTP policy."));
    }
  }

  // ── Template CRUD ─────────────────────────────────────────────────────────
  function openNewTemplate() {
    setEditingTemplate(null);
    setTemplateForm(emptyTemplate(selectedProvider));
    setTemplateFormError("");
    setTemplateFormOpen(true);
  }

  function openEditTemplate(t: SmsTemplateResponse) {
    setEditingTemplate(t);
    setTemplateForm(templateFromResponse(t));
    setTemplateFormError("");
    setTemplateFormOpen(true);
  }

  function closeTemplateForm() {
    setTemplateFormOpen(false);
    setEditingTemplate(null);
  }

  async function handleTemplateSave(e: React.FormEvent) {
    e.preventDefault();
    if (!templateForm.name.trim()) { setTemplateFormError("Template name is required."); return; }
    if (!templateForm.body.trim()) { setTemplateFormError("Template body is required."); return; }

    setTemplateSaving(true);
    setTemplateFormError("");

    const res = editingTemplate
      ? await adminSmsApi.updateTemplate(editingTemplate.id, {
          name: templateForm.name.trim(),
          body: templateForm.body.trim(),
          externalTemplateId: templateForm.externalTemplateId.trim() || undefined,
          isActive: templateForm.isActive,
        } satisfies UpdateSmsTemplateRequest)
      : await adminSmsApi.createTemplate({
          provider: templateForm.provider.trim() || undefined,
          name: templateForm.name.trim(),
          body: templateForm.body.trim(),
          externalTemplateId: templateForm.externalTemplateId.trim() || undefined,
          isActive: templateForm.isActive,
        } satisfies CreateSmsTemplateRequest);

    setTemplateSaving(false);
    if (res.ok) {
      closeTemplateForm();
      void loadTemplates();
    } else {
      setTemplateFormError(extractApiError(res.error, "Failed to save template."));
    }
  }

  async function handleTemplateDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    await adminSmsApi.deleteTemplate(deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
    void loadTemplates();
  }

  // ── Template table columns ────────────────────────────────────────────────
  const templateColumns: Column<SmsTemplateResponse>[] = [
    {
      key: "name",
      header: "Name",
      render: (t) => (
        <div>
          <p className="text-body-sm font-medium text-foreground">{t.name}</p>
          <p className="text-caption text-foreground-muted">{t.provider ?? "—"}</p>
        </div>
      ),
    },
    {
      key: "body",
      header: "Body",
      render: (t) => (
        <p className="text-caption text-foreground-muted truncate max-w-xs">{t.body}</p>
      ),
    },
    {
      key: "externalId",
      header: "DLT Template ID",
      render: (t) => (
        <span className="text-caption font-mono text-foreground-muted">
          {t.externalTemplateId ?? "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Active",
      render: (t) => (
        <span
          className={cn(
            "inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold",
            t.isActive
              ? "bg-success/10 text-success"
              : "bg-muted text-foreground-muted",
          )}
        >
          {t.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-20",
      render: (t) => (
        <div className="flex items-center justify-end gap-1">
          <button
            aria-label="Edit template"
            onClick={() => openEditTemplate(t)}
            className="h-7 w-7 flex items-center justify-center rounded text-foreground-muted hover:bg-muted hover:text-foreground transition-colors"
          >
            <Pencil className="size-3.5" />
          </button>
          <button
            aria-label="Delete template"
            onClick={() => setDeleteTarget(t)}
            className="h-7 w-7 flex items-center justify-center rounded text-foreground-muted hover:bg-danger/10 hover:text-danger transition-colors"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      ),
    },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="SMS"
        description="SMS provider configuration and phone verification settings."
      />

      {/* ── Integration card ── */}
      <AdminIntegrationCard
        title="SMS Provider"
        description="Gateway for sending OTP and transactional SMS messages."
        status={status}
        loading={loading}
        icon={<MessageSquare className="size-5" />}
      >
        <form onSubmit={handleIntegSave} noValidate className="flex flex-col gap-4">
          {integError && (
            <p role="alert" className="text-body-sm text-danger bg-danger/5 border border-danger/20 rounded-md px-4 py-3">
              {integError}
            </p>
          )}
          {integSuccess && (
            <p className="text-body-sm text-success bg-success/5 border border-success/20 rounded-md px-4 py-3">
              SMS integration saved.
            </p>
          )}

          {/* Provider select */}
          <div className="flex flex-col gap-1.5">
            <label className="text-body-sm font-medium text-foreground">
              Provider <span className="text-danger" aria-hidden="true">*</span>
            </label>
            <select
              value={selectedProvider}
              onChange={(e) => {
                setSelectedProvider(e.target.value);
                setProviderSettings({});
              }}
              aria-label="SMS provider"
              className="h-9 px-3 rounded-md border border-border bg-background text-body-sm text-foreground focus:outline-none focus:ring-2 focus:ring-focus"
            >
              <option value="">— Select provider —</option>
              {providers.map((p) => (
                <option key={p.name} value={p.name ?? ""}>
                  {p.name}{p.description ? ` — ${p.description}` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Provider instructions */}
          {selectedProvider && PROVIDER_INSTRUCTIONS[selectedProvider] && (
            <div>{PROVIDER_INSTRUCTIONS[selectedProvider]}</div>
          )}

          {/* Write-only secret notice */}
          {selectedProvider && status?.hasSecret && (
            <div className="rounded-md bg-warning/5 border border-warning/20 px-4 py-3">
              <p className="text-caption text-warning">
                Secret credentials are write-only. Leave fields blank to keep the current values.
              </p>
            </div>
          )}

          {/* Provider-specific fields */}
          {fieldKeys.length > 0 && selectedProvider && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {fieldKeys.map((key) => {
                const meta = FIELD_LABELS[key] ?? { label: key };
                return (
                  <Input
                    key={key}
                    label={meta.label}
                    type={meta.secret ? "password" : "text"}
                    autoComplete={meta.secret ? "new-password" : "off"}
                    value={providerSettings[key] ?? ""}
                    onChange={(e) =>
                      setProviderSettings((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                    placeholder={
                      meta.secret && status?.isConfigured
                        ? "Configured — enter new value to update"
                        : ""
                    }
                    hint={meta.hint}
                  />
                );
              })}
            </div>
          )}

          {/* Enable toggle */}
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={integEnabled}
              onChange={(e) => setIntegEnabled(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
            />
            <span className="flex flex-col">
              <span className="text-body-sm font-medium text-foreground">Enable SMS integration</span>
              <span className="text-caption text-foreground-muted">
                A provider must be selected and configured before enabling.
              </span>
            </span>
          </label>

          {integEnabled && !selectedProvider && (
            <p className="text-caption text-danger">
              Select a provider before enabling SMS.
            </p>
          )}

          <Button type="submit" variant="primary" size="sm" loading={integSaving} className="self-start">
            Save Integration
          </Button>
        </form>
      </AdminIntegrationCard>

      {/* ── OTP Policy settings (collapsible) ── */}
      <div className="rounded-lg border border-border bg-background overflow-hidden max-w-2xl">
        <button
          type="button"
          onClick={() => setShowPolicy((v) => !v)}
          className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-muted/40 transition-colors"
          aria-expanded={showPolicy}
        >
          <div>
            <p className="text-body font-semibold text-foreground">OTP Policy</p>
            <p className="text-caption text-foreground-muted">
              Phone verification behaviour — expiry, cooldown and attempt limits.
            </p>
          </div>
          {showPolicy
            ? <ChevronUp className="size-4 text-foreground-muted shrink-0" />
            : <ChevronDown className="size-4 text-foreground-muted shrink-0" />
          }
        </button>

        {showPolicy && (
          <div className="border-t border-border px-6 py-5">
            <form onSubmit={handlePolicySave} noValidate className="flex flex-col gap-4">
              {policyError && (
                <p role="alert" className="text-body-sm text-danger bg-danger/5 border border-danger/20 rounded-md px-4 py-3">
                  {policyError}
                </p>
              )}
              {policySuccess && (
                <p className="text-body-sm text-success bg-success/5 border border-success/20 rounded-md px-4 py-3">
                  OTP policy saved.
                </p>
              )}

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={mobileOtpEnabled}
                  onChange={(e) => setMobileOtpEnabled(e.target.checked)}
                  className="h-4 w-4 rounded border-border accent-primary"
                />
                <span className="text-body-sm font-medium text-foreground">
                  Require phone verification before checkout
                </span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  label="OTP expiry (minutes)"
                  type="number"
                  min={1}
                  max={60}
                  value={otpExpiryMinutes}
                  onChange={(e) => setOtpExpiryMinutes(e.target.value)}
                  hint="How long the code is valid."
                />
                <Input
                  label="Resend cooldown (seconds)"
                  type="number"
                  min={10}
                  max={300}
                  value={otpResendCooldown}
                  onChange={(e) => setOtpResendCooldown(e.target.value)}
                  hint="Minimum wait between resends."
                />
                <Input
                  label="Max attempts"
                  type="number"
                  min={1}
                  max={10}
                  value={otpMaxAttempts}
                  onChange={(e) => setOtpMaxAttempts(e.target.value)}
                  hint="Wrong guesses before lockout."
                />
              </div>

              <Button type="submit" variant="primary" size="sm" loading={policySaving} className="self-start">
                Save OTP Policy
              </Button>
            </form>
          </div>
        )}
      </div>

      {/* ── SMS Templates ── */}
      <Section title="SMS Templates">
        <p className="text-caption text-foreground-muted -mt-2">
          DLT-registered message templates sent for OTP and notifications.
          Each template body must include <code className="text-[11px] bg-muted px-1 rounded">{"{#var#}"}</code> where the code will be inserted (required for Indian DLT compliance).
        </p>

        {/* Inline template form */}
        {templateFormOpen && (
          <div className="rounded-lg border border-border bg-surface p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="text-body-sm font-semibold text-foreground">
                {editingTemplate ? "Edit Template" : "New Template"}
              </p>
              <button
                type="button"
                onClick={closeTemplateForm}
                aria-label="Close"
                className="h-7 w-7 flex items-center justify-center rounded text-foreground-muted hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleTemplateSave} noValidate className="flex flex-col gap-3">
              {templateFormError && (
                <p role="alert" className="text-caption text-danger">{templateFormError}</p>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Template name"
                  required
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. OTP Verification"
                />
                <div className="flex flex-col gap-1.5">
                  <label className="text-body-sm font-medium text-foreground">Provider</label>
                  <select
                    value={templateForm.provider}
                    onChange={(e) => setTemplateForm((f) => ({ ...f, provider: e.target.value }))}
                    aria-label="Template provider"
                    className="h-9 px-3 rounded-md border border-border bg-background text-body-sm text-foreground focus:outline-none focus:ring-2 focus:ring-focus"
                  >
                    <option value="">— Any / All —</option>
                    {providers.map((p) => (
                      <option key={p.name} value={p.name ?? ""}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-body-sm font-medium text-foreground">
                  Template body <span className="text-danger" aria-hidden="true">*</span>
                </label>
                <textarea
                  value={templateForm.body}
                  onChange={(e) => setTemplateForm((f) => ({ ...f, body: e.target.value }))}
                  rows={3}
                  aria-label="Template body"
                  placeholder={`Your {#var#} is the OTP for Kromic Store. Valid for 10 minutes. Do not share.`}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-body-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-focus resize-none"
                />
                <p className="text-caption text-foreground-muted">
                  Use <code className="text-[11px] bg-muted px-1 rounded">{"{#var#}"}</code> where the OTP code will be inserted.
                </p>
              </div>

              <Input
                label="DLT Template ID (optional)"
                value={templateForm.externalTemplateId}
                onChange={(e) => setTemplateForm((f) => ({ ...f, externalTemplateId: e.target.value }))}
                placeholder="Registered template ID from DLT portal"
                hint="Required for Indian DLT-compliant sending (Free2SMS)."
              />

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={templateForm.isActive}
                  onChange={(e) => setTemplateForm((f) => ({ ...f, isActive: e.target.checked }))}
                  className="h-4 w-4 rounded border-border accent-primary"
                />
                <span className="text-body-sm text-foreground">Active</span>
              </label>

              <div className="flex justify-end gap-2 pt-1">
                <Button variant="outline" size="sm" type="button" onClick={closeTemplateForm} disabled={templateSaving}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" loading={templateSaving}>
                  {editingTemplate ? "Save Template" : "Create Template"}
                </Button>
              </div>
            </form>
          </div>
        )}

        {!templateFormOpen && (
          <div className="self-start">
            <Button variant="outline" size="sm" type="button" onClick={openNewTemplate}>
              <Plus className="size-3.5 mr-1.5" /> Add Template
            </Button>
          </div>
        )}

        <AdminTable
          columns={templateColumns}
          rows={templates}
          rowKey={(t) => t.id}
          loading={templatesLoading}
          error={templatesError}
          emptyTitle="No templates yet"
          emptyDescription="Add a DLT-registered template to send SMS codes."
          onRetry={loadTemplates}
        />
      </Section>

      {/* Template delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleTemplateDelete}
        title="Delete template"
        description={`Delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        loading={deleting}
      />
    </div>
  );
}
