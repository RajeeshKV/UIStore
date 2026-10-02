"use client";

/**
 * Admin SMS Integration — schema-driven.
 *
 * The backend's GET /admin/integrations/sms/providers returns the full field schema per
 * provider (labels, types, required flags, secret flags, advanced flags, allowed values).
 * This component renders fields entirely from that schema — never from hard-coded field lists.
 *
 * Layout:
 *   ┌─ Status bar ─────────────────────────────────────────────────────────┐
 *   ├─ Gateway config ─────┬─ OTP Policy ─────────────────────────────────┤
 *   │  Provider selector   │  expiryMinutes / cooldown / maxAttempts       │
 *   │  Schema-driven fields│                                               │
 *   │  Delivery mode       │                                               │
 *   │  (advanced collapse) │                                               │
 *   └──────────────────────┴───────────────────────────────────────────────┘
 *   ┌─ Templates (only when requiresTemplate) ────────────────────────────┐
 *   └──────────────────────────────────────────────────────────────────────┘
 */

import { useEffect, useState, useCallback } from "react";
import {
  MessageSquare, Plus, Pencil, Trash2, X,
  ChevronDown, ChevronUp, CheckCircle2, AlertTriangle, WifiOff,
} from "lucide-react";
import { adminIntegrationsApi, adminSmsApi, adminSettingsApi } from "@/services/api/admin";
import { AdminPageHeader } from "@/features/admin/AdminPageHeader";
import { AdminTable, type Column } from "@/features/admin/AdminTable";
import { ConfirmDialog } from "@/features/admin/AdminDialog";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { extractApiError, cn } from "@/lib/utils";
import type {
  IntegrationStatusResponse,
  SmsProviderOptionResponse,
  SmsProviderSettingField,
  SmsTemplateResponse,
  CreateSmsTemplateRequest,
  UpdateSmsTemplateRequest,
} from "@/types/api";

// ── Schema-driven field renderer ──────────────────────────────────────────────

interface SchemaFieldProps {
  field: SmsProviderSettingField;
  value: string;
  onChange: (key: string, value: string) => void;
  isConfigured: boolean;
}

function SchemaField({ field, value, onChange, isConfigured }: SchemaFieldProps) {
  const placeholder = field.secret && isConfigured
    ? "Configured — enter new value to replace"
    : (field.placeholder ?? "");

  const commonClass =
    "w-full h-9 px-3 rounded-md border border-border bg-background text-body-sm text-foreground " +
    "placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-focus";

  const label = (
    <div className="flex flex-col gap-0.5">
      <span className="text-body-sm font-medium text-foreground">
        {field.label}
        {field.required && <span className="text-danger ml-0.5" aria-hidden="true">*</span>}
      </span>
      {field.helpText && <span className="text-caption text-foreground-muted">{field.helpText}</span>}
    </div>
  );

  if (field.type === "Select" && field.allowedValues) {
    return (
      <div className="flex flex-col gap-1.5">
        {label}
        <select
          value={value}
          onChange={(e) => onChange(field.key, e.target.value)}
          aria-label={field.label}
          className={commonClass}
        >
          <option value="">— Select —</option>
          {field.allowedValues.map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
        {field.formatHint && <p className="text-caption text-foreground-muted">{field.formatHint}</p>}
      </div>
    );
  }

  if (field.type === "Textarea") {
    return (
      <div className="flex flex-col gap-1.5">
        {label}
        <textarea
          value={value}
          onChange={(e) => onChange(field.key, e.target.value)}
          rows={3}
          aria-label={field.label}
          maxLength={field.maxLength ?? undefined}
          placeholder={placeholder}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-body-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-focus resize-none"
        />
        {field.formatHint && <p className="text-caption text-foreground-muted">{field.formatHint}</p>}
      </div>
    );
  }

  return (
    <Input
      label={field.label}
      type={field.type === "Secret" ? "password" : field.type === "Number" ? "number" : "text"}
      value={value}
      onChange={(e) => onChange(field.key, e.target.value)}
      placeholder={placeholder}
      hint={field.formatHint ?? undefined}
      autoComplete={field.secret ? "new-password" : "off"}
      required={field.required}
    />
  );
}

// ── Schema-driven field group (splits required/optional/advanced) ─────────────

interface FieldGroupProps {
  fields: SmsProviderSettingField[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  isConfigured: boolean;
}

function FieldGroup({ fields, values, onChange, isConfigured }: FieldGroupProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const required = fields.filter((f) => !f.advanced && f.required);
  const optional = fields.filter((f) => !f.advanced && !f.required);
  const advanced = fields.filter((f) => f.advanced);

  // Gather all non-advanced into a responsive grid
  const standard = [...required, ...optional];

  return (
    <div className="flex flex-col gap-4">
      {standard.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          {standard.map((f) => (
            <SchemaField
              key={f.key}
              field={f}
              value={values[f.key] ?? ""}
              onChange={onChange}
              isConfigured={isConfigured}
            />
          ))}
        </div>
      )}

      {/* Advanced settings collapse */}
      {advanced.length > 0 && (
        <div className="border border-border rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-left bg-muted/40 hover:bg-muted/60 transition-colors"
            aria-expanded={showAdvanced}
          >
            <span className="text-body-sm font-medium text-foreground-muted">
              Advanced settings ({advanced.length})
            </span>
            {showAdvanced
              ? <ChevronUp className="size-4 text-foreground-muted shrink-0" />
              : <ChevronDown className="size-4 text-foreground-muted shrink-0" />
            }
          </button>
          {showAdvanced && (
            <div className="px-4 py-3 grid grid-cols-1 xl:grid-cols-2 gap-3">
              {advanced.map((f) => (
                <SchemaField
                  key={f.key}
                  field={f}
                  value={values[f.key] ?? ""}
                  onChange={onChange}
                  isConfigured={isConfigured}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Status strip ──────────────────────────────────────────────────────────────

function SmsStatusStrip({ status }: { status: IntegrationStatusResponse }) {
  const provider = status.publicFields?.selectedProvider ?? status.publicFields?.provider ?? "";
  const missing = status.publicFields?.missingSettings ?? "";

  if (!status.enabled) {
    return (
      <div className="flex items-center gap-3 rounded-md bg-muted/60 border border-border px-4 py-2.5">
        <WifiOff className="size-4 text-foreground-muted shrink-0" />
        <p className="text-body-sm text-foreground-muted">SMS is off — customers cannot receive codes.</p>
      </div>
    );
  }
  if (!status.isConfigured) {
    return (
      <div className="flex flex-col gap-1 rounded-md bg-warning/5 border border-warning/30 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <AlertTriangle className="size-4 text-warning shrink-0" />
          <p className="text-body-sm text-warning font-medium">SMS is on but not ready to send.</p>
        </div>
        {missing && <p className="text-caption text-foreground-muted pl-6">Missing: {missing}</p>}
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 rounded-md bg-success/5 border border-success/30 px-4 py-2.5">
      <CheckCircle2 className="size-4 text-success shrink-0" />
      <p className="text-body-sm text-success font-medium">
        SMS active{provider ? ` — ${provider}` : ""}.
      </p>
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
  provider: provider ?? "", name: "", body: "", externalTemplateId: "", isActive: true,
});

function templateFromResponse(t: SmsTemplateResponse): TemplateFormState {
  return { provider: t.provider ?? "", name: t.name ?? "", body: t.body ?? "", externalTemplateId: t.externalTemplateId ?? "", isActive: t.isActive };
}

// ── Templates section ─────────────────────────────────────────────────────────

interface TemplatesSectionProps {
  selectedProvider: string;
  providerSchema: SmsProviderOptionResponse | null;
}

function TemplatesSection({ selectedProvider, providerSchema }: TemplatesSectionProps) {
  const [templates, setTemplates] = useState<SmsTemplateResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SmsTemplateResponse | null>(null);
  const [form, setForm] = useState<TemplateFormState>(emptyTemplate(selectedProvider));
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<SmsTemplateResponse | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setLoadError(null);
    const res = await adminSmsApi.listTemplates();
    if (res.ok) setTemplates(res.data);
    else setLoadError(extractApiError(res.error, "Failed to load templates."));
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  // Derive which template fields to show from provider schema
  const templateFields = providerSchema?.templateFields ?? [];

  function openNew() {
    setEditing(null);
    setForm(emptyTemplate(selectedProvider));
    setFormError(""); setFormOpen(true);
  }

  function openEdit(t: SmsTemplateResponse) {
    setEditing(t);
    setForm(templateFromResponse(t));
    setFormError(""); setFormOpen(true);
  }

  function closeForm() { setFormOpen(false); setEditing(null); }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setFormError("Template name is required."); return; }
    // Per API: 2Factor requires externalTemplateId → 400 SMS_TEMPLATE_INVALID if missing
    const requiresExtId = providerSchema?.name === "2Factor" || (templateFields.some((f) => f.key === "externalTemplateId" && f.required));
    if (requiresExtId && !form.externalTemplateId.trim()) {
      setFormError("Template ID / name is required for this provider."); return;
    }
    setSaving(true); setFormError("");
    const res = editing
      ? await adminSmsApi.updateTemplate(editing.id, {
          name: form.name.trim(),
          body: form.body.trim() || undefined,
          externalTemplateId: form.externalTemplateId.trim() || undefined,
          isActive: form.isActive,
        } satisfies UpdateSmsTemplateRequest)
      : await adminSmsApi.createTemplate({
          provider: form.provider.trim() || undefined,
          name: form.name.trim(),
          body: form.body.trim() || undefined,
          externalTemplateId: form.externalTemplateId.trim() || undefined,
          isActive: form.isActive,
        } satisfies CreateSmsTemplateRequest);
    setSaving(false);
    if (res.ok) { closeForm(); void load(); }
    else setFormError(extractApiError(res.error, "Failed to save template."));
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    await adminSmsApi.deleteTemplate(deleteTarget.id);
    setDeleting(false); setDeleteTarget(null);
    void load();
  }

  const columns: Column<SmsTemplateResponse>[] = [
    {
      key: "name", header: "Name",
      render: (t) => (
        <div>
          <p className="text-body-sm font-medium text-foreground">{t.name}</p>
          <p className="text-caption text-foreground-muted">{t.provider ?? "—"}</p>
        </div>
      ),
    },
    {
      key: "extId", header: "Template ID / Name",
      render: (t) => <code className="text-caption font-mono text-foreground-muted">{t.externalTemplateId ?? "—"}</code>,
    },
    {
      key: "body", header: "Body",
      render: (t) => <p className="text-caption text-foreground-muted truncate max-w-xs">{t.body ?? "—"}</p>,
    },
    {
      key: "status", header: "Active",
      render: (t) => (
        <span className={cn("inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold",
          t.isActive ? "bg-success/10 text-success" : "bg-muted text-foreground-muted")}>
          {t.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "actions", header: "", className: "w-16",
      render: (t) => (
        <div className="flex gap-1">
          <button aria-label="Edit" onClick={() => openEdit(t)} className="h-7 w-7 flex items-center justify-center rounded text-foreground-muted hover:bg-muted hover:text-foreground">
            <Pencil className="size-3.5" />
          </button>
          <button aria-label="Delete" onClick={() => setDeleteTarget(t)} className="h-7 w-7 flex items-center justify-center rounded text-foreground-muted hover:bg-danger/10 hover:text-danger">
            <Trash2 className="size-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="rounded-lg border border-border bg-background p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-border pb-2">
        <div>
          <h3 className="text-body-sm font-semibold text-foreground">SMS Templates</h3>
          <p className="text-caption text-foreground-muted mt-0.5">
            DLT-registered templates. Body must include{" "}
            <code className="text-[11px] bg-muted px-1 rounded">{"{#var#}"}</code> where the OTP code is inserted.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={openNew} iconLeft={<Plus className="size-3.5" />}>
          Add Template
        </Button>
      </div>

      {/* Inline form */}
      {formOpen && (
        <div className="rounded-lg border border-border bg-surface-elevated p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-body-sm font-semibold text-foreground">{editing ? "Edit Template" : "New Template"}</p>
            <button type="button" onClick={closeForm} aria-label="Close" className="h-7 w-7 flex items-center justify-center rounded text-foreground-muted hover:bg-muted">
              <X className="size-4" />
            </button>
          </div>
          {formError && <p className="text-body-sm text-danger bg-danger/5 border border-danger/20 rounded px-3 py-2">{formError}</p>}
          <form onSubmit={handleSave} noValidate>
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-3">
              <Input
                label="Template name"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Login OTP"
              />
              <Input
                label="Template ID / name"
                value={form.externalTemplateId}
                onChange={(e) => setForm((f) => ({ ...f, externalTemplateId: e.target.value }))}
                placeholder={providerSchema?.name === "2Factor" ? "e.g. LOGIN_OTP" : providerSchema?.name === "Twilio" ? "HJ…" : "Numeric DLT ID"}
                hint={providerSchema?.name === "2Factor" ? "Required — template name on 2Factor account." : providerSchema?.name === "Twilio" ? "Optional — Verify Template SID." : "DLT-registered template id."}
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-body-sm font-medium text-foreground">Provider</label>
                <input
                  value={form.provider}
                  onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value }))}
                  placeholder="e.g. 2Factor"
                  className="h-9 px-3 rounded-md border border-border bg-background text-body-sm text-foreground focus:outline-none focus:ring-2 focus:ring-focus"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-body-sm font-medium text-foreground">Status</label>
                <select
                  value={form.isActive ? "active" : "inactive"}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.value === "active" }))}
                  aria-label="Template status"
                  className="h-9 px-3 rounded-md border border-border bg-background text-body-sm text-foreground focus:outline-none focus:ring-2 focus:ring-focus"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="flex flex-col gap-1.5 mb-3">
              <label className="text-body-sm font-medium text-foreground">Body</label>
              <textarea
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                rows={2}
                aria-label="Template body"
                placeholder={"Your OTP is {#var#}. Valid for {#var#} minutes."}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-body-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-focus resize-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" type="button" onClick={closeForm} disabled={saving}>Cancel</Button>
              <Button variant="primary" size="sm" type="submit" loading={saving}>Save Template</Button>
            </div>
          </form>
        </div>
      )}

      <AdminTable
        columns={columns}
        rows={templates}
        rowKey={(t) => t.id}
        loading={loading}
        error={loadError}
        emptyTitle="No templates"
        emptyDescription="Add a template to send OTP codes through this provider."
        onRetry={load}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete template"
        description={`Delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        loading={deleting}
      />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function AdminSmsIntegrationClient() {
  // ── Provider schema (from GET /providers) ────────────────────────────────
  const [providers, setProviders] = useState<SmsProviderOptionResponse[]>([]);
  const [providersLoading, setProvidersLoading] = useState(true);

  // ── Integration status ────────────────────────────────────────────────────
  const [status, setStatus] = useState<IntegrationStatusResponse | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);

  // ── Gateway form ──────────────────────────────────────────────────────────
  const [selectedProvider, setSelectedProvider] = useState("");
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [integEnabled, setIntegEnabled] = useState(false);
  const [integSaving, setIntegSaving] = useState(false);
  const [integError, setIntegError] = useState("");
  const [integSuccess, setIntegSuccess] = useState(false);

  // ── OTP policy form ───────────────────────────────────────────────────────
  const [otpExpiry, setOtpExpiry] = useState("10");
  const [otpCooldown, setOtpCooldown] = useState("60");
  const [otpMaxAttempts, setOtpMaxAttempts] = useState("5");
  const [policySaving, setPolicySaving] = useState(false);
  const [policyError, setPolicyError] = useState("");
  const [policySuccess, setPolicySuccess] = useState(false);

  // ── Load providers schema ─────────────────────────────────────────────────
  const loadProviders = useCallback(async () => {
    setProvidersLoading(true);
    const res = await adminSmsApi.getProviders();
    if (res.ok) setProviders(res.data);
    setProvidersLoading(false);
  }, []);

  // ── Load status + settings ────────────────────────────────────────────────
  const loadStatus = useCallback(async () => {
    setStatusLoading(true);
    const [smsRes, settingsRes] = await Promise.all([
      adminIntegrationsApi.getSms(),
      adminSettingsApi.get(),
    ]);
    if (smsRes.ok) {
      const s = smsRes.data;
      setStatus(s);
      setIntegEnabled(s.enabled);
      // Active provider from publicFields
      const active = s.publicFields?.selectedProvider ?? s.publicFields?.provider ?? "";
      if (active) setSelectedProvider(active);
    }
    if (settingsRes.ok && settingsRes.data.auth) {
      const a = settingsRes.data.auth;
      setOtpExpiry(String(a.otpExpiryMinutes ?? 10));
      setOtpCooldown(String(a.otpResendCooldownSeconds ?? 60));
      setOtpMaxAttempts(String(a.otpMaxAttempts ?? 5));
    }
    setStatusLoading(false);
  }, []);

  useEffect(() => {
    void loadProviders();
    void loadStatus();
  }, [loadProviders, loadStatus]);

  // When provider changes, clear field values (new provider's keys are different)
  function handleProviderChange(name: string) {
    setSelectedProvider(name);
    setFieldValues({});
  }

  function setFieldValue(key: string, value: string) {
    setFieldValues((prev) => ({ ...prev, [key]: value }));
  }

  // The schema for the currently selected provider
  const activeSchema = providers.find((p) => p.name === selectedProvider) ?? null;

  // ── Save gateway ──────────────────────────────────────────────────────────
  async function handleIntegSave(e: React.FormEvent) {
    e.preventDefault();
    if (integEnabled && !selectedProvider) {
      setIntegError("Select a provider before enabling SMS."); return;
    }

    // Client-side required field validation using schema
    if (activeSchema && integEnabled) {
      const missing = activeSchema.requiredSettings.filter((k) => !fieldValues[k]?.trim());
      if (missing.length) {
        const labels = missing.map((k) => activeSchema.settings.find((f) => f.key === k)?.label ?? k).join(", ");
        setIntegError(`Required: ${labels}`); return;
      }
    }

    setIntegSaving(true); setIntegError(""); setIntegSuccess(false);

    // Build settings: omit blank values (blank secret = keep existing)
    const settings: Record<string, string> = {};
    for (const [k, v] of Object.entries(fieldValues)) {
      if (v.trim()) settings[k] = v.trim();
    }

    const res = await adminIntegrationsApi.updateSms({
      enabled: integEnabled,
      provider: selectedProvider || undefined,
      providerSettings: Object.keys(settings).length ? settings : undefined,
    });

    setIntegSaving(false);
    if (res.ok) {
      setStatus(res.data);
      setIntegEnabled(res.data.enabled);
      // Clear secret fields after save
      if (activeSchema) {
        setFieldValues((prev) => {
          const next = { ...prev };
          activeSchema.settings.forEach((f) => { if (f.secret) delete next[f.key]; });
          return next;
        });
      }
      setIntegSuccess(true); setTimeout(() => setIntegSuccess(false), 3000);
    } else {
      setIntegError(extractApiError(res.error, "Failed to save SMS integration."));
    }
  }

  // ── Save OTP policy ───────────────────────────────────────────────────────
  async function handlePolicySave(e: React.FormEvent) {
    e.preventDefault();
    setPolicySaving(true); setPolicyError(""); setPolicySuccess(false);
    const res = await adminSettingsApi.updateAuth({
      otpExpiryMinutes: parseInt(otpExpiry) || 10,
      otpResendCooldownSeconds: parseInt(otpCooldown) || 60,
      otpMaxAttempts: parseInt(otpMaxAttempts) || 5,
    });
    setPolicySaving(false);
    if (res.ok) { setPolicySuccess(true); setTimeout(() => setPolicySuccess(false), 3000); }
    else setPolicyError(extractApiError(res.error, "Failed to save OTP policy."));
  }

  // ── Status badge ──────────────────────────────────────────────────────────
  const providerDisplay = status?.publicFields?.selectedProvider ?? status?.publicFields?.provider ?? "";
  const statusLabel = !status
    ? null
    : !status.isConfigured
    ? <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-0.5 text-caption font-medium text-foreground-muted"><span className="h-1.5 w-1.5 rounded-full bg-foreground-muted" />Not Configured</span>
    : !status.enabled
    ? <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/30 bg-warning/10 px-2.5 py-0.5 text-caption font-medium text-warning"><span className="h-1.5 w-1.5 rounded-full bg-warning" />Configured, Disabled</span>
    : <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2.5 py-0.5 text-caption font-medium text-success"><span className="h-1.5 w-1.5 rounded-full bg-success" />Active{providerDisplay ? ` — ${providerDisplay}` : ""}</span>;

  const loading = providersLoading || statusLoading;

  return (
    <div className="flex flex-col gap-4">
      <AdminPageHeader title="SMS" description="SMS provider configuration and phone verification settings." />

      {/* ── Status bar ────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 rounded-lg border border-border bg-background px-4 py-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
          <MessageSquare className="size-5 text-foreground-muted" />
        </div>
        <div className="flex-1">
          <p className="text-body-sm font-semibold text-foreground">SMS Gateway</p>
          <p className="text-caption text-foreground-muted">Sends OTP verification codes to customers.</p>
        </div>
        {loading ? <Skeleton className="h-6 w-28 rounded-full" /> : statusLabel}
      </div>

      {/* ── Live status strip (after load) ───────────────────────────────── */}
      {!loading && status && <SmsStatusStrip status={status} />}

      {/* ── Two-column: Gateway config | OTP Policy ──────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* Gateway config — takes 2 cols */}
        <div className="xl:col-span-2 rounded-lg border border-border bg-background p-4 flex flex-col gap-4">
          <h3 className="text-body-sm font-semibold text-foreground border-b border-border pb-2">Gateway</h3>

          {integError && <p role="alert" className="text-body-sm text-danger bg-danger/5 border border-danger/20 rounded-md px-3 py-2">{integError}</p>}
          {integSuccess && <p className="text-body-sm text-success bg-success/5 border border-success/20 rounded-md px-3 py-2">SMS integration saved.</p>}

          {status?.hasSecret && (
            <p className="text-caption text-warning bg-warning/5 border border-warning/20 rounded-md px-3 py-2">
              Credentials are write-only — leave fields blank to keep existing values.
            </p>
          )}

          <form onSubmit={handleIntegSave} noValidate className="flex flex-col gap-4">
            {/* Provider selector */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="sms-provider" className="text-body-sm font-medium text-foreground">
                Provider <span className="text-danger" aria-hidden="true">*</span>
              </label>
              {providersLoading ? (
                <Skeleton className="h-9 w-full rounded-md" />
              ) : (
                <select
                  id="sms-provider"
                  value={selectedProvider}
                  onChange={(e) => handleProviderChange(e.target.value)}
                  className="h-9 px-3 rounded-md border border-border bg-background text-body-sm text-foreground focus:outline-none focus:ring-2 focus:ring-focus"
                >
                  <option value="">— Select provider —</option>
                  {providers.map((p) => (
                    <option key={p.name} value={p.name}>{p.name}{p.description ? ` — ${p.description}` : ""}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Provider notes */}
            {activeSchema?.notes && activeSchema.notes.length > 0 && (
              <div className="rounded-md bg-blue-50 border border-blue-200 px-3 py-2.5 flex flex-col gap-1">
                {activeSchema.notes.map((note, i) => (
                  <p key={i} className="text-caption text-blue-800">{note}</p>
                ))}
              </div>
            )}

            {/* Schema-driven fields */}
            {activeSchema && activeSchema.settings.length > 0 && (
              <FieldGroup
                fields={activeSchema.settings}
                values={fieldValues}
                onChange={setFieldValue}
                isConfigured={status?.isConfigured ?? false}
              />
            )}

            {/* Delivery mode — only when provider supports native OTP */}
            {activeSchema?.supportsNativeOtp && (
              <div className="flex flex-col gap-1.5">
                <label className="text-body-sm font-medium text-foreground">Delivery mode</label>
                <select
                  value={fieldValues["DeliveryMode"] ?? ""}
                  onChange={(e) => setFieldValue("DeliveryMode", e.target.value)}
                  aria-label="Delivery mode"
                  className="h-9 px-3 rounded-md border border-border bg-background text-body-sm text-foreground focus:outline-none focus:ring-2 focus:ring-focus"
                >
                  <option value="">Auto (default)</option>
                  <option value="Auto">Auto — native first, fallback to template</option>
                  <option value="NativeOtp">NativeOtp — native endpoint only</option>
                  <option value="TransactionalTemplate">TransactionalTemplate — always use template</option>
                </select>
                <p className="text-caption text-foreground-muted">
                  Auto is recommended for reliability. Use TransactionalTemplate to keep this app authoritative over verification.
                </p>
              </div>
            )}

            {/* Staged guidance */}
            {selectedProvider && !integEnabled && (
              <p className="text-caption text-foreground-muted bg-muted/50 rounded-md px-3 py-2">
                Save with SMS disabled to store credentials first, then enable once all required fields are complete.
              </p>
            )}

            <div className="flex items-center justify-between gap-4 pt-1 border-t border-border">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={integEnabled}
                  onChange={(e) => setIntegEnabled(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
                />
                <span className="flex flex-col">
                  <span className="text-body-sm font-medium text-foreground">Enable SMS</span>
                  <span className="text-caption text-foreground-muted">All required credentials must be present.</span>
                </span>
              </label>
              <Button type="submit" variant="primary" size="sm" loading={integSaving}>Save</Button>
            </div>
          </form>
        </div>

        {/* OTP Policy — 1 col */}
        <div className="rounded-lg border border-border bg-background p-4 flex flex-col gap-4">
          <h3 className="text-body-sm font-semibold text-foreground border-b border-border pb-2">OTP Policy</h3>
          <p className="text-caption text-foreground-muted -mt-1">Code expiry, resend cooldown and attempt limits.</p>

          {policyError && <p role="alert" className="text-body-sm text-danger bg-danger/5 border border-danger/20 rounded-md px-3 py-2">{policyError}</p>}
          {policySuccess && <p className="text-body-sm text-success bg-success/5 border border-success/20 rounded-md px-3 py-2">OTP policy saved.</p>}

          <form onSubmit={handlePolicySave} noValidate className="flex flex-col gap-3">
            <Input
              label="Expiry (minutes)"
              type="number"
              min={1}
              max={60}
              value={otpExpiry}
              onChange={(e) => setOtpExpiry(e.target.value)}
              hint="How long a code stays valid."
            />
            <Input
              label="Resend cooldown (seconds)"
              type="number"
              min={10}
              max={300}
              value={otpCooldown}
              onChange={(e) => setOtpCooldown(e.target.value)}
              hint="Minimum wait between resend requests."
            />
            <Input
              label="Max attempts"
              type="number"
              min={1}
              max={10}
              value={otpMaxAttempts}
              onChange={(e) => setOtpMaxAttempts(e.target.value)}
              hint="Wrong guesses before the code is invalidated."
            />
            <div className="flex justify-end pt-1 border-t border-border">
              <Button type="submit" variant="primary" size="sm" loading={policySaving}>Save</Button>
            </div>
          </form>
        </div>
      </div>

      {/* ── Templates section — only when provider requiresTemplate ──────── */}
      {!loading && activeSchema?.requiresTemplate && (
        <TemplatesSection selectedProvider={selectedProvider} providerSchema={activeSchema} />
      )}
    </div>
  );
}
