"use client";

/**
 * Admin SMS Integration
 * =====================
 * Two-panel layout matching the spec:
 *
 *  Panel 1 — Gateway (PUT /api/v1/admin/integrations/sms)
 *    Provider list and active provider come from GET publicFields.selectableProviders /
 *    publicFields.selectedProvider — NOT from a separate /providers endpoint.
 *    PUT returns 200 with the updated IntegrationStatusResponse; no re-fetch needed.
 *    Staged setup: save with enabled:false first, then enable once credentials are complete.
 *
 *  Panel 2 — OTP Policy (PUT /api/v1/admin/settings/auth)
 *    Fields: otpExpiryMinutes, otpResendCooldownSeconds, otpMaxAttempts.
 *    smsProvider is intentionally NOT sent (ignored by backend, must be omitted).
 *
 *  Panel 3 — SMS Templates (separate CRUD table, optional)
 *
 * Secrets are write-only: values are never returned by any endpoint.
 * Leave a secret field blank to keep the stored value; submit a value to replace it.
 */

import { useEffect, useState, useCallback } from "react";
import {
  MessageSquare,
  Plus,
  Pencil,
  Trash2,
  X,
  Info,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  WifiOff,
} from "lucide-react";
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
  SmsTemplateResponse,
  CreateSmsTemplateRequest,
  UpdateSmsTemplateRequest,
} from "@/types/api";

// ── Provider field definitions (from spec) ────────────────────────────────────
//
// Required settings per provider (spec-defined, matched case-insensitively by backend):
//   2Factor    required: apiKey          optional: senderId, baseUrl, sendPath, otpVariableName, expiryVariableName
//   Free2SMS   required: apiKey, senderId  optional: baseUrl, route
//   Twilio     required: accountSid, authToken, serviceSid  optional: messagingServiceSid, baseUrl
//
// We only render required fields in the form; optional fields are advanced and rarely needed.

interface FieldMeta {
  label: string;
  secret?: boolean;
  hint?: string;
}

const FIELD_META: Record<string, FieldMeta> = {
  apiKey:        { label: "API Key",       secret: true,  hint: "Write-only — leave blank to keep the current value." },
  senderId:      { label: "Sender ID",     secret: false, hint: "Registered 6-character alphabetic ID (e.g. KROMIC)." },
  accountSid:    { label: "Account SID",   secret: false, hint: "From your Twilio console dashboard." },
  authToken:     { label: "Auth Token",    secret: true,  hint: "Write-only — leave blank to keep the current value." },
  serviceSid:    { label: "Service SID",   secret: false, hint: "Twilio Messaging Service SID (starts with MG…)." },
};

// Required fields per provider name (case-sensitive match to backend provider names)
const PROVIDER_REQUIRED_FIELDS: Record<string, string[]> = {
  "2Factor":  ["apiKey"],
  "Free2SMS": ["apiKey", "senderId"],
  "Twilio":   ["accountSid", "authToken", "serviceSid"],
};

// ── Provider-specific help text ───────────────────────────────────────────────

function ProviderInstructions({ provider }: { provider: string }) {
  if (provider === "Free2SMS") {
    return (
      <div className="rounded-md bg-blue-50 border border-blue-200 px-4 py-3 text-body-sm text-blue-800 flex flex-col gap-1.5">
        <p className="font-semibold flex items-center gap-1.5">
          <Info className="size-3.5 shrink-0" /> Free2SMS setup
        </p>
        <ul className="list-disc list-inside text-caption space-y-1">
          <li>Sign in at <strong>free2sms.com</strong> → Developer → API and copy your API key.</li>
          <li>Register a <strong>Sender ID</strong> (6-character alphabetic, e.g. KROMIC).</li>
          <li>Create and register a DLT template on the TRAI portal — the body must include{" "}
            <code className="text-[11px] bg-blue-100 px-1 rounded">{"{#var#}"}</code> where the code goes.
          </li>
          <li>Enter the DLT-approved template in the SMS Templates section below.</li>
        </ul>
      </div>
    );
  }
  if (provider === "Twilio") {
    return (
      <div className="rounded-md bg-purple-50 border border-purple-200 px-4 py-3 text-body-sm text-purple-800 flex flex-col gap-1.5">
        <p className="font-semibold flex items-center gap-1.5">
          <Info className="size-3.5 shrink-0" /> Twilio setup
        </p>
        <ul className="list-disc list-inside text-caption space-y-1">
          <li>Copy your <strong>Account SID</strong> and <strong>Auth Token</strong> from console.twilio.com.</li>
          <li>Create a Messaging Service in the console and copy its <strong>Service SID</strong> (starts with MG…).</li>
          <li>Delivery to India requires a supported international trunk — verify your account coverage.</li>
        </ul>
      </div>
    );
  }
  if (provider === "2Factor") {
    return (
      <div className="rounded-md bg-amber-50 border border-amber-200 px-4 py-3 text-body-sm text-amber-800 flex flex-col gap-1.5">
        <p className="font-semibold flex items-center gap-1.5">
          <Info className="size-3.5 shrink-0" /> 2Factor setup
        </p>
        <ul className="list-disc list-inside text-caption space-y-1">
          <li>Log in at <strong>2factor.in</strong> and copy your <strong>API Key</strong> from the dashboard.</li>
          <li>No sender ID is required for the default OTP template.</li>
        </ul>
      </div>
    );
  }
  return null;
}

// ── Status strip ──────────────────────────────────────────────────────────────

function SmsStatusStrip({ status }: { status: IntegrationStatusResponse }) {
  const { enabled, isConfigured, publicFields } = status;
  const provider = publicFields?.selectedProvider ?? publicFields?.provider ?? "";
  const missing = publicFields?.missingSettings ?? "";
  const requireVerified = publicFields?.requireVerifiedPhoneAtCheckout === "True";

  if (!enabled) {
    return (
      <div className="flex items-start gap-3 rounded-md bg-muted/60 border border-border px-4 py-3">
        <WifiOff className="size-4 text-foreground-muted mt-0.5 shrink-0" />
        <p className="text-body-sm text-foreground-muted">
          SMS is off. Customers cannot receive codes.
        </p>
      </div>
    );
  }

  if (enabled && !isConfigured) {
    return (
      <div className="flex flex-col gap-2 rounded-md bg-warning/5 border border-warning/30 px-4 py-3">
        <div className="flex items-start gap-3">
          <AlertTriangle className="size-4 text-warning mt-0.5 shrink-0" />
          <p className="text-body-sm text-warning font-medium">
            SMS is on but not ready to send.
          </p>
        </div>
        {missing && (
          <p className="text-caption text-foreground-muted pl-7">
            Missing: {missing}
          </p>
        )}
      </div>
    );
  }

  // enabled && isConfigured
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start gap-3 rounded-md bg-success/5 border border-success/30 px-4 py-3">
        <CheckCircle2 className="size-4 text-success mt-0.5 shrink-0" />
        <p className="text-body-sm text-success font-medium">
          SMS is active{provider ? ` on ${provider}` : ""}.
        </p>
      </div>
      {requireVerified && (
        <div className="flex items-start gap-3 rounded-md bg-muted/60 border border-border px-4 py-3">
          <Info className="size-4 text-foreground-muted mt-0.5 shrink-0" />
          <p className="text-caption text-foreground-muted">
            Customers must verify a phone number before checkout.
          </p>
        </div>
      )}
    </div>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-background p-6 flex flex-col gap-4 max-w-2xl">
      <h3 className="text-body font-semibold text-foreground border-b border-border pb-3">{title}</h3>
      {children}
    </div>
  );
}

// ── Template form state ───────────────────────────────────────────────────────

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

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Parse the comma-separated selectableProviders string into a trimmed list. */
function parseSelectableProviders(csv: string | undefined): string[] {
  if (!csv) return [];
  return csv.split(",").map((p) => p.trim()).filter(Boolean);
}

// ── Main component ────────────────────────────────────────────────────────────

export function AdminSmsIntegrationClient() {
  // ── Integration state ─────────────────────────────────────────────────────
  const [status, setStatus] = useState<IntegrationStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [selectedProvider, setSelectedProvider] = useState("");
  const [providerSettings, setProviderSettings] = useState<Record<string, string>>({});
  const [integEnabled, setIntegEnabled] = useState(false);
  const [integSaving, setIntegSaving] = useState(false);
  const [integError, setIntegError] = useState("");
  const [integSuccess, setIntegSuccess] = useState(false);

  // ── OTP policy state ──────────────────────────────────────────────────────
  const [otpExpiryMinutes, setOtpExpiryMinutes] = useState("10");
  const [otpResendCooldown, setOtpResendCooldown] = useState("60");
  const [otpMaxAttempts, setOtpMaxAttempts] = useState("5");
  const [policySaving, setPolicySaving] = useState(false);
  const [policyError, setPolicyError] = useState("");
  const [policySuccess, setPolicySuccess] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);

  // ── Templates state ───────────────────────────────────────────────────────
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

  // ── Hydrate form from IntegrationStatusResponse ───────────────────────────
  function applyStatus(s: IntegrationStatusResponse) {
    setStatus(s);
    setIntegEnabled(s.enabled);
    // Active provider comes from publicFields.selectedProvider (per spec)
    const active = s.publicFields?.selectedProvider ?? s.publicFields?.provider ?? "";
    if (active) setSelectedProvider(active);
  }

  // ── Load ──────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    const [smsRes, settingsRes] = await Promise.all([
      adminIntegrationsApi.getSms(),
      adminSettingsApi.get(),
    ]);

    if (smsRes.ok) applyStatus(smsRes.data);

    if (settingsRes.ok && settingsRes.data.auth) {
      const a = settingsRes.data.auth;
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
    if (res.ok) setTemplates(res.data);
    else setTemplatesError(extractApiError(res.error, "Failed to load templates."));
  }, []);

  useEffect(() => {
    void load();
    void loadTemplates();
  }, [load, loadTemplates]);

  // ── Derived ───────────────────────────────────────────────────────────────
  // Provider dropdown comes from publicFields.selectableProviders (CSV) per spec.
  const selectableProviders = parseSelectableProviders(
    status?.publicFields?.selectableProviders,
  );

  // Required fields for the currently selected provider (spec-defined)
  const fieldKeys: string[] = selectedProvider
    ? (PROVIDER_REQUIRED_FIELDS[selectedProvider] ?? ["apiKey"])
    : [];

  // ── Save integration ──────────────────────────────────────────────────────
  async function handleIntegSave(e: React.FormEvent) {
    e.preventDefault();
    if (integEnabled && !selectedProvider) {
      setIntegError("Select a provider before enabling SMS.");
      return;
    }

    setIntegSaving(true);
    setIntegError("");
    setIntegSuccess(false);

    // Build providerSettings — omit blank values (blank secret = keep existing)
    const settings: Record<string, string> = {};
    for (const key of fieldKeys) {
      const val = providerSettings[key];
      if (val?.trim()) settings[key] = val.trim();
    }

    const res = await adminIntegrationsApi.updateSms({
      enabled: integEnabled,
      provider: selectedProvider || undefined,
      providerSettings: Object.keys(settings).length ? settings : undefined,
    });

    setIntegSaving(false);

    if (res.ok) {
      // PUT returns 200 with the updated status — use it directly, no re-fetch.
      applyStatus(res.data);

      // Clear secret fields after save (values are write-only)
      setProviderSettings((prev) => {
        const cleared = { ...prev };
        for (const key of fieldKeys) {
          if (FIELD_META[key]?.secret) cleared[key] = "";
        }
        return cleared;
      });

      setIntegSuccess(true);
      setTimeout(() => setIntegSuccess(false), 3000);
    } else {
      setIntegError(extractApiError(res.error, "Failed to save SMS integration."));
    }
  }

  // ── Save OTP policy ───────────────────────────────────────────────────────
  // Note: smsProvider is intentionally NOT sent — the backend ignores it and
  // the spec explicitly says to omit it.
  async function handlePolicySave(e: React.FormEvent) {
    e.preventDefault();
    setPolicySaving(true);
    setPolicyError("");
    setPolicySuccess(false);

    const res = await adminSettingsApi.updateAuth({
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

      {/* ── Integration card ────────────────────────────────────────────── */}
      <AdminIntegrationCard
        title="SMS Provider"
        description="Gateway for sending OTP and transactional SMS messages."
        status={status}
        loading={loading}
        icon={<MessageSquare className="size-5" />}
      >
        {/* Status strip — driven by enabled + isConfigured per spec */}
        {status && <SmsStatusStrip status={status} />}

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

          {/* Provider dropdown — list from publicFields.selectableProviders */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="sms-provider" className="text-body-sm font-medium text-foreground">
              Provider <span className="text-danger" aria-hidden="true">*</span>
            </label>
            <select
              id="sms-provider"
              value={selectedProvider}
              onChange={(e) => {
                setSelectedProvider(e.target.value);
                setProviderSettings({});
              }}
              className="h-9 px-3 rounded-md border border-border bg-background text-body-sm text-foreground focus:outline-none focus:ring-2 focus:ring-focus"
            >
              <option value="">— Select provider —</option>
              {selectableProviders.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Provider-specific instructions */}
          {selectedProvider && <ProviderInstructions provider={selectedProvider} />}

          {/* Write-only secret notice */}
          {selectedProvider && status?.hasSecret && (
            <div className="rounded-md bg-warning/5 border border-warning/20 px-4 py-3">
              <p className="text-caption text-warning">
                Credentials are write-only. Leave fields blank to keep current values.
              </p>
            </div>
          )}

          {/* Provider-specific required fields */}
          {fieldKeys.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {fieldKeys.map((key) => {
                const meta = FIELD_META[key] ?? { label: key };
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

          {/* Staged-setup guidance */}
          {selectedProvider && !integEnabled && (
            <p className="text-caption text-foreground-muted">
              Save with SMS disabled to store credentials first. Enable once configuration is complete.
            </p>
          )}

          {/* Changing provider while enabled requires full credentials */}
          {integEnabled &&
            selectedProvider &&
            status?.enabled &&
            selectedProvider !== (status.publicFields?.selectedProvider ?? status.publicFields?.provider) && (
              <p className="text-caption text-warning">
                Changing the provider while SMS is enabled requires all credentials for the new provider in the same save.
              </p>
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
                All required credentials must be present before enabling.
              </span>
            </span>
          </label>

          <Button
            type="submit"
            variant="primary"
            size="sm"
            loading={integSaving}
            className="self-start"
          >
            Save Integration
          </Button>
        </form>
      </AdminIntegrationCard>

      {/* ── OTP Policy (collapsible) ─────────────────────────────────────── */}
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
              Code expiry, resend cooldown and attempt limits.
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  label="Expiry (minutes)"
                  type="number"
                  min={1}
                  max={60}
                  value={otpExpiryMinutes}
                  onChange={(e) => setOtpExpiryMinutes(e.target.value)}
                  hint="How long a code is valid."
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

      {/* ── SMS Templates ────────────────────────────────────────────────── */}
      <Section title="SMS Templates">
        <p className="text-caption text-foreground-muted -mt-2">
          DLT-registered message templates. The backend has a sensible default body so this
          section is optional for new deployments. Each template body must include{" "}
          <code className="text-[11px] bg-muted px-1 rounded">{"{#var#}"}</code> where the OTP
          code will be inserted.
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
                  <label htmlFor="tpl-provider" className="text-body-sm font-medium text-foreground">
                    Provider
                  </label>
                  <select
                    id="tpl-provider"
                    value={templateForm.provider}
                    onChange={(e) => setTemplateForm((f) => ({ ...f, provider: e.target.value }))}
                    className="h-9 px-3 rounded-md border border-border bg-background text-body-sm text-foreground focus:outline-none focus:ring-2 focus:ring-focus"
                  >
                    <option value="">— Any / All —</option>
                    {selectableProviders.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="tpl-body" className="text-body-sm font-medium text-foreground">
                  Template body <span className="text-danger" aria-hidden="true">*</span>
                </label>
                <textarea
                  id="tpl-body"
                  value={templateForm.body}
                  onChange={(e) => setTemplateForm((f) => ({ ...f, body: e.target.value }))}
                  rows={3}
                  placeholder={`Your OTP is {#var#}. Valid for 10 minutes. Do not share.`}
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
          emptyDescription="Add a DLT-registered template to customise the OTP message body."
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
