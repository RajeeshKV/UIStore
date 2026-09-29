"use client";
import { extractApiError } from "@/lib/utils";

import { useEffect, useState, useCallback } from "react";
import { adminSettingsApi } from "@/services/api/admin";
import { AdminPageHeader } from "@/features/admin/AdminPageHeader";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import type { UpdateSeoSettingsRequest } from "@/types/api";

export function AdminSeoClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<UpdateSeoSettingsRequest>({
    metaTitle: "",
    metaDescription: "",
    metaKeywords: "",
    faviconUrl: "",
    ogImageUrl: "",
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await adminSettingsApi.get();
    if (res.ok && res.data.seo) {
      const s = res.data.seo;
      setForm({
        metaTitle: s.metaTitle ?? "",
        metaDescription: s.metaDescription ?? "",
        metaKeywords: s.metaKeywords ?? "",
        faviconUrl: s.faviconUrl ?? "",
        ogImageUrl: s.ogImageUrl ?? "",
      });
    } else if (!res.ok) {
      setError(extractApiError(res.error, "Failed to load SEO settings."));
    }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  function set<K extends keyof UpdateSeoSettingsRequest>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError("");
    setSaveSuccess(false);

    const payload: UpdateSeoSettingsRequest = {
      metaTitle: form.metaTitle?.trim() || undefined,
      metaDescription: form.metaDescription?.trim() || undefined,
      metaKeywords: form.metaKeywords?.trim() || undefined,
      faviconUrl: form.faviconUrl?.trim() || undefined,
      ogImageUrl: form.ogImageUrl?.trim() || undefined,
    };

    const res = await adminSettingsApi.updateSeo(payload);
    setSaving(false);
    if (res.ok) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } else {
      setSaveError(extractApiError(res.error, "Failed to save SEO settings."));
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-56 w-full max-w-lg rounded-lg" />
      </div>
    );
  }

  if (error) {
    return <ErrorState title="Failed to load" description={error} onRetry={load} />;
  }

  return (
    <form onSubmit={handleSave} noValidate className="flex flex-col gap-6">
      <AdminPageHeader
        title="SEO"
        description="Search engine optimisation settings for your store."
        action={
          <Button type="submit" variant="primary" size="sm" loading={saving}>
            Save Changes
          </Button>
        }
      />

      {saveError && (
        <p role="alert" className="text-body-sm text-danger bg-danger/5 border border-danger/20 rounded-md px-4 py-3 max-w-lg">{saveError}</p>
      )}
      {saveSuccess && (
        <p className="text-body-sm text-success bg-success/5 border border-success/20 rounded-md px-4 py-3 max-w-lg">SEO settings saved.</p>
      )}

      <div className="rounded-lg border border-border bg-background p-6 flex flex-col gap-5 max-w-lg">
        <Input
          label="Meta title"
          value={form.metaTitle ?? ""}
          onChange={(e) => set("metaTitle", e.target.value)}
          hint="Shown in browser tab and search results. ~60 characters."
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-body-sm font-medium text-foreground">Meta description</label>
          <textarea
            value={form.metaDescription ?? ""}
            onChange={(e) => set("metaDescription", e.target.value)}
            rows={3}
            aria-label="Meta description"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-body-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-focus resize-none"
            placeholder="Brief description of your store for search engines. ~160 characters."
          />
        </div>
        <Input
          label="Meta keywords"
          value={form.metaKeywords ?? ""}
          onChange={(e) => set("metaKeywords", e.target.value)}
          hint="Comma-separated keywords."
        />
        <Input
          label="Favicon URL"
          type="url"
          value={form.faviconUrl ?? ""}
          onChange={(e) => set("faviconUrl", e.target.value)}
          hint="URL to your .ico or .png favicon (32×32 recommended)."
        />
        <Input
          label="Open Graph image URL"
          type="url"
          value={form.ogImageUrl ?? ""}
          onChange={(e) => set("ogImageUrl", e.target.value)}
          hint="Social sharing preview image (1200×630 recommended)."
        />
      </div>
    </form>
  );
}
