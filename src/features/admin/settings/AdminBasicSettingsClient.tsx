"use client";
import { extractApiError } from "@/lib/utils";

import { useEffect, useState, useCallback } from "react";
import { adminSettingsApi } from "@/services/api/admin";
import { AdminPageHeader } from "@/features/admin/AdminPageHeader";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import type { UpdateBasicInfoRequest, AdminBusinessSettingsResponse } from "@/types/api";

export function AdminBasicSettingsClient() {
  const [settings, setSettings] = useState<AdminBusinessSettingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<UpdateBasicInfoRequest>({
    businessName: "", legalName: "", websiteUrl: "", supportEmail: "",
    supportPhone: "", address: "", facebookUrl: "", instagramUrl: "",
    twitterUrl: "", youtubeUrl: "", whatsAppNumber: "", linkedInUrl: "",
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Store open state
  const [storeOpenSaving, setStoreOpenSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await adminSettingsApi.get();
    if (res.ok) {
      const d = res.data;
      setSettings(d);
      setForm({
        businessName: d.businessName ?? "",
        legalName: d.legalName ?? "",
        websiteUrl: d.websiteUrl ?? "",
        supportEmail: d.supportEmail ?? "",
        supportPhone: d.supportPhone ?? "",
        address: d.address ?? "",
        facebookUrl: d.facebookUrl ?? "",
        instagramUrl: d.instagramUrl ?? "",
        twitterUrl: d.twitterUrl ?? "",
        youtubeUrl: d.youtubeUrl ?? "",
        whatsAppNumber: d.whatsAppNumber ?? "",
        linkedInUrl: d.linkedInUrl ?? "",
      });
    } else {
      setError(extractApiError(res.error, "Failed to load settings."));
    }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  function set<K extends keyof UpdateBasicInfoRequest>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError("");
    setSaveSuccess(false);
    const payload: UpdateBasicInfoRequest = {};
    for (const [k, v] of Object.entries(form)) {
      if (v !== "") (payload as Record<string, string>)[k] = v as string;
    }
    const res = await adminSettingsApi.updateBasic(payload);
    setSaving(false);
    if (res.ok) {
      setSettings(res.data);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } else {
      setSaveError(extractApiError(res.error, "Failed to save settings."));
    }
  }

  async function handleToggleStore() {
    if (!settings) return;
    setStoreOpenSaving(true);
    const res = await adminSettingsApi.setStoreOpen({
      isOpen: !settings.isStoreOpen,
    });
    setStoreOpenSaving(false);
    if (res.ok) setSettings(res.data);
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-80 w-full max-w-lg rounded-lg" />
      </div>
    );
  }

  if (error) {
    return <ErrorState title="Failed to load" description={error} onRetry={load} />;
  }

  return (
    <form onSubmit={handleSave} noValidate className="flex flex-col gap-6">
      <AdminPageHeader
        title="Basic Information"
        description="Your store name, contact details and social links."
        action={
          <Button type="submit" variant="primary" size="sm" loading={saving}>
            Save Changes
          </Button>
        }
      />

      {saveError && (
        <p role="alert" className="text-body-sm text-danger bg-danger/5 border border-danger/20 rounded-md px-4 py-3 max-w-lg">
          {saveError}
        </p>
      )}
      {saveSuccess && (
        <p className="text-body-sm text-success bg-success/5 border border-success/20 rounded-md px-4 py-3 max-w-lg">
          Settings saved successfully.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2 max-w-3xl">
        {/* Business info */}
        <div className="rounded-lg border border-border bg-background p-5 flex flex-col gap-4">
          <h3 className="text-body font-semibold text-foreground border-b border-border pb-3">Business Details</h3>
          <Input label="Business name" value={form.businessName ?? ""} onChange={(e) => set("businessName", e.target.value)} />
          <Input label="Legal name" value={form.legalName ?? ""} onChange={(e) => set("legalName", e.target.value)} />
          <Input label="Website URL" type="url" value={form.websiteUrl ?? ""} onChange={(e) => set("websiteUrl", e.target.value)} />
          <Input label="Support email" type="email" value={form.supportEmail ?? ""} onChange={(e) => set("supportEmail", e.target.value)} />
          <Input label="Support phone" type="tel" value={form.supportPhone ?? ""} onChange={(e) => set("supportPhone", e.target.value)} />
          <Input label="Address" value={form.address ?? ""} onChange={(e) => set("address", e.target.value)} />

          {/* Logo — via logoUrl which is read-only from API, shown for reference */}
          {settings?.logoUrl && (
            <div className="flex flex-col gap-1.5">
              <p className="text-body-sm font-medium text-foreground">Current logo</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={settings.logoUrl} alt="Store logo" className="h-10 w-auto object-contain" />
              <p className="text-caption text-foreground-muted">Logo URL is managed via the store integration settings.</p>
            </div>
          )}
        </div>

        {/* Social links */}
        <div className="flex flex-col gap-4">
          <div className="rounded-lg border border-border bg-background p-5 flex flex-col gap-4">
            <div>
              <h3 className="text-body font-semibold text-foreground border-b border-border pb-3">Social Links</h3>
              <p className="text-caption text-foreground-muted mt-2">These appear as icons in the website footer. Configure any you want shown.</p>
            </div>
            <Input label="Facebook URL" type="url" value={form.facebookUrl ?? ""} onChange={(e) => set("facebookUrl", e.target.value)} placeholder="https://facebook.com/yourpage" />
            <Input label="Instagram URL" type="url" value={form.instagramUrl ?? ""} onChange={(e) => set("instagramUrl", e.target.value)} placeholder="https://instagram.com/yourhandle" />
            <Input label="Twitter / X URL" type="url" value={form.twitterUrl ?? ""} onChange={(e) => set("twitterUrl", e.target.value)} placeholder="https://x.com/yourhandle" />
            <Input label="YouTube URL" type="url" value={form.youtubeUrl ?? ""} onChange={(e) => set("youtubeUrl", e.target.value)} placeholder="https://youtube.com/@channel" />
            <Input label="WhatsApp number" type="tel" value={form.whatsAppNumber ?? ""} onChange={(e) => set("whatsAppNumber", e.target.value)} placeholder="+919876543210" hint="Include country code. Shown in Contact Us section and footer." />
            <Input label="LinkedIn URL" type="url" value={form.linkedInUrl ?? ""} onChange={(e) => set("linkedInUrl", e.target.value)} placeholder="https://linkedin.com/company/yourcompany" />
          </div>

          {/* Store open/close toggle */}
          <div className="rounded-lg border border-border bg-background p-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-body-sm font-semibold text-foreground">Store status</p>
              <p className="text-caption text-foreground-muted mt-0.5">
                {settings?.isStoreOpen ? "Store is currently open." : "Store is currently closed."}
              </p>
            </div>
            <Button
              type="button"
              variant={settings?.isStoreOpen ? "danger" : "primary"}
              size="sm"
              loading={storeOpenSaving}
              onClick={handleToggleStore}
            >
              {settings?.isStoreOpen ? "Close store" : "Open store"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
