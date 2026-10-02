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

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-background p-4 flex flex-col gap-4">
      <h3 className="text-body-sm font-semibold text-foreground border-b border-border pb-2">{title}</h3>
      {children}
    </div>
  );
}

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
  const [storeOpenSaving, setStoreOpenSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await adminSettingsApi.get();
    if (res.ok) {
      const d = res.data;
      setSettings(d);
      setForm({
        businessName: d.businessName ?? "", legalName: d.legalName ?? "",
        websiteUrl: d.websiteUrl ?? "", supportEmail: d.supportEmail ?? "",
        supportPhone: d.supportPhone ?? "", address: d.address ?? "",
        facebookUrl: d.facebookUrl ?? "", instagramUrl: d.instagramUrl ?? "",
        twitterUrl: d.twitterUrl ?? "", youtubeUrl: d.youtubeUrl ?? "",
        whatsAppNumber: d.whatsAppNumber ?? "", linkedInUrl: d.linkedInUrl ?? "",
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
    setSaving(true); setSaveError(""); setSaveSuccess(false);
    const payload: UpdateBasicInfoRequest = {};
    for (const [k, v] of Object.entries(form)) {
      if (v !== "") (payload as Record<string, string>)[k] = v as string;
    }
    const res = await adminSettingsApi.updateBasic(payload);
    setSaving(false);
    if (res.ok) { setSettings(res.data); setSaveSuccess(true); setTimeout(() => setSaveSuccess(false), 3000); }
    else setSaveError(extractApiError(res.error, "Failed to save settings."));
  }

  async function handleToggleStore() {
    if (!settings) return;
    setStoreOpenSaving(true);
    const res = await adminSettingsApi.setStoreOpen({ isOpen: !settings.isStoreOpen });
    setStoreOpenSaving(false);
    if (res.ok) setSettings(res.data);
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-40" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-64 rounded-lg" />
          <Skeleton className="h-64 rounded-lg" />
          <Skeleton className="h-48 rounded-lg" />
          <Skeleton className="h-48 rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) return <ErrorState title="Failed to load" description={error} onRetry={load} />;

  return (
    <form onSubmit={handleSave} noValidate className="flex flex-col gap-4">
      <AdminPageHeader
        title="Basic Information"
        description="Store name, contact details and social links."
        action={<Button type="submit" variant="primary" size="sm" loading={saving}>Save Changes</Button>}
      />

      {saveError && <p role="alert" className="text-body-sm text-danger bg-danger/5 border border-danger/20 rounded-md px-4 py-2">{saveError}</p>}
      {saveSuccess && <p className="text-body-sm text-success bg-success/5 border border-success/20 rounded-md px-4 py-2">Settings saved.</p>}

      {/* Row 1: Business identity */}
      <Card title="Business Identity">
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          <Input label="Business name" value={form.businessName ?? ""} onChange={(e) => set("businessName", e.target.value)} />
          <Input label="Legal name" value={form.legalName ?? ""} onChange={(e) => set("legalName", e.target.value)} />
          <Input label="Support email" type="email" value={form.supportEmail ?? ""} onChange={(e) => set("supportEmail", e.target.value)} />
          <Input label="Support phone" type="tel" value={form.supportPhone ?? ""} onChange={(e) => set("supportPhone", e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Website URL" type="url" value={form.websiteUrl ?? ""} onChange={(e) => set("websiteUrl", e.target.value)} />
          <Input label="Address" value={form.address ?? ""} onChange={(e) => set("address", e.target.value)} />
        </div>
        {settings?.logoUrl && (
          <div className="flex items-center gap-3 pt-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={settings.logoUrl} alt="Store logo" className="h-8 w-auto object-contain" />
            <p className="text-caption text-foreground-muted">Logo is managed via integration settings.</p>
          </div>
        )}
      </Card>

      {/* Row 2: Social links + Store status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Card title="Social Links">
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
              <Input label="Facebook" type="url" value={form.facebookUrl ?? ""} onChange={(e) => set("facebookUrl", e.target.value)} placeholder="https://facebook.com/…" />
              <Input label="Instagram" type="url" value={form.instagramUrl ?? ""} onChange={(e) => set("instagramUrl", e.target.value)} placeholder="https://instagram.com/…" />
              <Input label="Twitter / X" type="url" value={form.twitterUrl ?? ""} onChange={(e) => set("twitterUrl", e.target.value)} placeholder="https://x.com/…" />
              <Input label="YouTube" type="url" value={form.youtubeUrl ?? ""} onChange={(e) => set("youtubeUrl", e.target.value)} placeholder="https://youtube.com/…" />
              <Input label="WhatsApp" type="tel" value={form.whatsAppNumber ?? ""} onChange={(e) => set("whatsAppNumber", e.target.value)} placeholder="+919876543210" />
              <Input label="LinkedIn" type="url" value={form.linkedInUrl ?? ""} onChange={(e) => set("linkedInUrl", e.target.value)} placeholder="https://linkedin.com/…" />
            </div>
          </Card>
        </div>

        <Card title="Store Status">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className={`inline-flex h-2 w-2 rounded-full ${settings?.isStoreOpen ? "bg-success" : "bg-danger"}`} />
              <span className="text-body-sm font-medium text-foreground">
                {settings?.isStoreOpen ? "Open" : "Closed"}
              </span>
            </div>
            <p className="text-caption text-foreground-muted">
              {settings?.isStoreOpen
                ? "Customers can browse and purchase."
                : "The storefront is hidden from customers."}
            </p>
            <Button
              type="button"
              variant={settings?.isStoreOpen ? "danger" : "primary"}
              size="sm"
              loading={storeOpenSaving}
              onClick={handleToggleStore}
              className="self-start"
            >
              {settings?.isStoreOpen ? "Close store" : "Open store"}
            </Button>
          </div>
        </Card>
      </div>
    </form>
  );
}
