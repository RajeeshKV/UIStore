"use client";

/**
 * Admin SMS Integration — schema-driven from GET /providers.
 *
 * Layout:
 *   ┌─ Status bar ─────────────────────────────────────────────────────────┐
 *   ├─ Gateway config ───────────────────┬─ OTP Policy ────────────────────┤
 *   │  Provider selector                 │  expiry / cooldown / attempts   │
 *   │  Schema-driven credential fields   │                                 │
 *   │  Provider notes                    │                                 │
 *   └────────────────────────────────────┴─────────────────────────────────┘
 *
 * No templates section — templates management was removed per spec.
 * No DeliveryMode dropdown — no provider schema exposes this field.
 * Secrets are write-only: blank = preserve existing, non-blank = replace.
 */

import { useEffect, useState, useCallback } from "react";
import { MessageSquare, CheckCircle2, AlertTriangle, WifiOff, Info } from "lucide-react";
import { adminIntegrationsApi, adminSmsApi, adminSettingsApi } from "@/services/api/admin";
import { AdminPageHeader } from "@/features/admin/AdminPageHeader";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { extractApiError, cn } from "@/lib/utils";
import type {
  SmsProviderOptionResponse,
  SmsProviderSettingField,
  SmsIntegrationStatusResponse,
} from "@/types/api";

// ── Schema field renderer ─────────────────────────────────────────────────────

interface SchemaFieldProps {
  field: SmsProviderSettingField;
  value: string;
  onChange: (key: string, value: string) => void;
  isConfigured: boolean;
}

function SchemaField({ field, value, onChange, isConfigured }: SchemaFieldProps) {
  const isSecret = field.type === "Secret";
  // Secrets are write-only — never pre-fill, show placeholder only when already configured
  const placeholder = isSecret && isConfigured
    ? "Configured — enter new value to replace"
    : "";

  const inputId = `sms-field-${field.key}`;

  if (field.type === "Textarea") {
    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={inputId} className="text-body-sm font-medium text-foreground">
          {field.label}
          {field.required && <span className="text-danger ml-0.5" aria-hidden="true">*</span>}
        </label>
        <textarea
          id={inputId}
          value={value}
          onChange={(e) => onChange(field.key, e.target.value)}
          rows={3}
          aria-label={field.label}
          maxLength={field.maxLength ?? undefined}
          placeholder={placeholder}
          required={field.required}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-body-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-focus resize-none"
        />
        {field.description && (
          <p className="text-caption text-foreground-muted">{field.description}</p>
        )}
      </div>
    );
  }

  if (field.type === "Select" && field.allowedValues) {
    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={inputId} className="text-body-sm font-medium text-foreground">
          {field.label}
          {field.required && <span className="text-danger ml-0.5" aria-hidden="true">*</span>}
        </label>
        <select
          id={inputId}
          value={value}
          onChange={(e) => onChange(field.key, e.target.value)}
          aria-label={field.label}
          required={field.required}
          className="h-9 px-3 rounded-md border border-border bg-background text-body-sm text-foreground focus:outline-none focus:ring-2 focus:ring-focus"
        >
          <option value="">— Select —</option>
          {field.allowedValues.map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
        {field.description && (
          <p className="text-caption text-foreground-muted">{field.description}</p>
        )}
      </div>
    );
  }

  // Text / Secret / Number — all render as a single input
  return (
    <Input
      label={field.label}
      type={isSecret ? "password" : field.type === "Number" ? "number" : "text"}
      value={value}
      onChange={(e) => onChange(field.key, e.target.value)}
      placeholder={placeholder}
      hint={field.description ?? undefined}
      autoComplete={isSecret ? "new-password" : "off"}
      required={field.required}
      maxLength={field.maxLength ?? undefined}
    />
  );
}

// ── Status strip ──────────────────────────────────────────────────────────────

function SmsStatusStrip({ status }: { status: SmsIntegrationStatusResponse }) {
  if (!status.enabled) {
    return (
      <div className="flex items-center gap-3 rounded-lg bg-muted/60 border border-border px-4 py-2.5">
        <WifiOff className="size-4 text-foreground-muted shrink-0" />
        <p className="text-body-sm text-foreground-muted">SMS delivery is disabled — customers cannot receive codes.</p>
      </div>
    );
  }
  if (!status.isConfigured) {
    return (
      <div className="flex flex-col gap-2 rounded-lg bg-warning/5 border border-warning/30 px-4 py-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="size-4 text-warning shrink-0" />
          <p className="text-body-sm text-warning font-medium">
            SMS is enabled but not fully configured.
          </p>
        </div>
        {status.missingSettings.length > 0 && (
          <p className="text-caption text-foreground-muted pl-6">
            Missing: {status.missingSettings.join(", ")}
          </p>
        )}
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 rounded-lg bg-success/5 border border-success/30 px-4 py-2.5">
      <CheckCircle2 className="size-4 text-success shrink-0" />
      <p className="text-body-sm text-success font-medium">
        SMS active{status.provider ? ` — ${status.provider}` : ""}.
      </p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function AdminSmsIntegrationClient() {
  // ── Provider catalogue ────────────────────────────────────────────────────
  const [providers, setProviders] = useState<SmsProviderOptionResponse[]>([]);
  const [providersLoading, setProvidersLoading] = useState(true);

  // ── Integration status ────────────────────────────────────────────────────
  const [status, setStatus] = useState<SmsIntegrationStatusResponse | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);

  // ── Gateway form ──────────────────────────────────────────────────────────
  const [selectedProvider, setSelectedProvider] = useState("");
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [integEnabled, setIntegEnabled] = useState(false);
  const [integSaving, setIntegSaving] = useState(false);
  const [integError, setIntegError] = useState("");
  const [integSuccess, setIntegSuccess] = useState(false);

  // ── OTP policy ────────────────────────────────────────────────────────────
  const [otpExpiry, setOtpExpiry] = useState("10");
  const [otpCooldown, setOtpCooldown] = useState("60");
  const [otpMaxAttempts, setOtpMaxAttempts] = useState("5");
  const [policySaving, setPolicySaving] = useState(false);
  const [policyError, setPolicyError] = useState("");
  const [policySuccess, setPolicySuccess] = useState(false);

  // ── Load ──────────────────────────────────────────────────────────────────
  const loadProviders = useCallback(async () => {
    setProvidersLoading(true);
    const res = await adminSmsApi.getProviders();
    if (res.ok) setProviders(res.data);
    setProvidersLoading(false);
  }, []);

  const loadStatus = useCallback(async () => {
    setStatusLoading(true);
    const [smsRes, settingsRes] = await Promise.all([
      adminIntegrationsApi.getSms(),
      adminSettingsApi.get(),
    ]);
    if (smsRes.ok) {
      const s = smsRes.data as SmsIntegrationStatusResponse;
      setStatus(s);
      setIntegEnabled(s.enabled);
      if (s.provider) setSelectedProvider(s.provider);
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

  // Switching provider clears field values — new provider has different keys
  function handleProviderChange(name: string) {
    setSelectedProvider(name);
    setFieldValues({});
  }

  function setFieldValue(key: string, val: string) {
    setFieldValues((prev) => ({ ...prev, [key]: val }));
  }

  const activeSchema: SmsProviderOptionResponse | null =
    providers.find((p) => p.name === selectedProvider) ?? null;

  // ── Save gateway config ───────────────────────────────────────────────────
  async function handleIntegSave(e: React.FormEvent) {
    e.preventDefault();

    if (integEnabled && !selectedProvider) {
      setIntegError("Select a provider before enabling SMS."); return;
    }

    // Client-side required field check
    if (activeSchema && integEnabled) {
      const missingLabels = activeSchema.requiredSettings
        .filter((k) => !fieldValues[k]?.trim())
        .map((k) => activeSchema.settings.find((f) => f.key === k)?.label ?? k);
      if (missingLabels.length) {
        setIntegError(`Required: ${missingLabels.join(", ")}`); return;
      }
    }

    setIntegSaving(true); setIntegError(""); setIntegSuccess(false);

    // Omit blank values — blank secret = preserve existing credential
    const providerSettings: Record<string, string> = {};
    for (const [k, v] of Object.entries(fieldValues)) {
      if (v.trim()) providerSettings[k] = v.trim();
    }

    const res = await adminIntegrationsApi.updateSms({
      enabled: integEnabled,
      provider: selectedProvider || undefined,
      providerSettings: Object.keys(providerSettings).length ? providerSettings : undefined,
    });

    setIntegSaving(false);
    if (res.ok) {
      const updated = res.data as SmsIntegrationStatusResponse;
      setStatus(updated);
      setIntegEnabled(updated.enabled);
      // Clear secret field values — they are write-only
      if (activeSchema) {
        setFieldValues((prev) => {
          const next = { ...prev };
          activeSchema.settings.forEach((f) => { if (f.type === "Secret") delete next[f.key]; });
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

  // ── Top-bar status badge ──────────────────────────────────────────────────
  const loading = providersLoading || statusLoading;

  const topBadge = !status ? null
    : !status.isConfigured
    ? <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-0.5 text-caption font-medium text-foreground-muted"><span className="h-1.5 w-1.5 rounded-full bg-foreground-muted" />Not Configured</span>
    : !status.enabled
    ? <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/30 bg-warning/10 px-2.5 py-0.5 text-caption font-medium text-warning"><span className="h-1.5 w-1.5 rounded-full bg-warning" />Configured, Disabled</span>
    : <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2.5 py-0.5 text-caption font-medium text-success"><span className="h-1.5 w-1.5 rounded-full bg-success" />Active{status.provider ? ` — ${status.provider}` : ""}</span>;

  return (
    <div className="flex flex-col gap-4">
      <AdminPageHeader title="SMS" description="SMS provider credentials and phone verification policy." />

      {/* ── Status bar ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 rounded-lg border border-border bg-background px-4 py-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
          <MessageSquare className="size-5 text-foreground-muted" />
        </div>
        <div className="flex-1">
          <p className="text-body-sm font-semibold text-foreground">SMS Gateway</p>
          <p className="text-caption text-foreground-muted">Sends OTP verification codes to customers.</p>
        </div>
        {loading ? <Skeleton className="h-6 w-28 rounded-full" /> : topBadge}
      </div>

      {/* ── Live status strip ─────────────────────────────────────────── */}
      {!loading && status && <SmsStatusStrip status={status} />}

      {/* ── Two-column: Gateway (2/3) | OTP Policy (1/3) ─────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* Gateway config */}
        <div className="xl:col-span-2 rounded-lg border border-border bg-background p-4 flex flex-col gap-4">
          <h3 className="text-body-sm font-semibold text-foreground border-b border-border pb-2">
            Gateway Credentials
          </h3>

          {integError && (
            <p role="alert" className="text-body-sm text-danger bg-danger/5 border border-danger/20 rounded-md px-3 py-2">
              {integError}
            </p>
          )}
          {integSuccess && (
            <p className="text-body-sm text-success bg-success/5 border border-success/20 rounded-md px-3 py-2">
              SMS integration saved.
            </p>
          )}

          {/* Write-only notice when credentials already stored */}
          {status?.isConfigured && (
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
                    <option key={p.name} value={p.name}>
                      {p.name}{p.description ? ` — ${p.description}` : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Schema-driven credential fields */}
            {activeSchema && activeSchema.settings.length > 0 && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                {activeSchema.settings.map((field: SmsProviderSettingField) => (
                  <div key={field.key} className={cn(field.type === "Textarea" && "xl:col-span-2")}>
                    <SchemaField
                      field={field}
                      value={fieldValues[field.key] ?? ""}
                      onChange={setFieldValue}
                      isConfigured={status?.isConfigured ?? false}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Provider notes */}
            {activeSchema?.notes && activeSchema.notes.length > 0 && (
              <div className="rounded-md bg-muted/60 border border-border px-3 py-2.5 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Info className="size-3.5 text-foreground-muted shrink-0" />
                  <span className="text-caption font-semibold text-foreground-muted">Notes</span>
                </div>
                {activeSchema.notes.map((note, i) => (
                  <p key={i} className="text-caption text-foreground-muted pl-5">{note}</p>
                ))}
              </div>
            )}

            {/* Staged guidance */}
            {selectedProvider && !integEnabled && !status?.isConfigured && (
              <p className="text-caption text-foreground-muted bg-muted/40 rounded-md px-3 py-2">
                Tip: save with SMS disabled to store credentials first, then enable once all required fields are filled.
              </p>
            )}

            {/* Enable toggle + save */}
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
                  <span className="text-caption text-foreground-muted">
                    All required credentials must be saved before enabling.
                  </span>
                </span>
              </label>
              <Button type="submit" variant="primary" size="sm" loading={integSaving}>
                Save
              </Button>
            </div>
          </form>
        </div>

        {/* OTP Policy */}
        <div className="rounded-lg border border-border bg-background p-4 flex flex-col gap-4">
          <h3 className="text-body-sm font-semibold text-foreground border-b border-border pb-2">
            OTP Policy
          </h3>
          <p className="text-caption text-foreground-muted -mt-1">
            Code expiry, resend cooldown and attempt limits.
          </p>

          {policyError && (
            <p role="alert" className="text-body-sm text-danger bg-danger/5 border border-danger/20 rounded-md px-3 py-2">
              {policyError}
            </p>
          )}
          {policySuccess && (
            <p className="text-body-sm text-success bg-success/5 border border-success/20 rounded-md px-3 py-2">
              OTP policy saved.
            </p>
          )}

          <form onSubmit={handlePolicySave} noValidate className="flex flex-col gap-3">
            <Input
              label="Code expiry (minutes)"
              type="number"
              min={1}
              max={60}
              value={otpExpiry}
              onChange={(e) => setOtpExpiry(e.target.value)}
              hint="How long a code stays valid after sending."
            />
            <Input
              label="Resend cooldown (seconds)"
              type="number"
              min={10}
              max={300}
              value={otpCooldown}
              onChange={(e) => setOtpCooldown(e.target.value)}
              hint="Minimum wait before a new code can be requested."
            />
            <Input
              label="Max attempts"
              type="number"
              min={1}
              max={10}
              value={otpMaxAttempts}
              onChange={(e) => setOtpMaxAttempts(e.target.value)}
              hint="Wrong guesses allowed before the code is invalidated."
            />
            <div className="flex justify-end pt-1 border-t border-border">
              <Button type="submit" variant="primary" size="sm" loading={policySaving}>
                Save
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
