"use client";

import { useState, useEffect } from "react";
import { customerApi } from "@/services/api/customer";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import type { CustomerProfileResponse } from "@/types/api";

export function ProfileClient() {
  const { success: toastSuccess, error: toastError } = useToast();
  const [profile, setProfile] = useState<CustomerProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Editable fields — UpdateCustomerProfileRequest shape
  const [form, setForm] = useState({
    displayName: "",
    phoneNumber: "",
    dateOfBirth: "",
    newsletterConsent: false,
  });

  useEffect(() => {
    const fetch = async () => {
      const result = await customerApi.getProfile();
      if (result.ok) {
        const p = result.data;
        setProfile(p);
        setForm({
          displayName: p.displayName ?? "",
          phoneNumber: p.phoneNumber ?? "",
          dateOfBirth: p.dateOfBirth ?? "",
          newsletterConsent: p.newsletterConsent,
        });
      }
      setLoading(false);
    };
    void fetch();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrors({});

    const result = await customerApi.updateProfile({
      displayName: form.displayName || undefined,
      phoneNumber: form.phoneNumber || undefined,
      dateOfBirth: form.dateOfBirth || undefined,
      newsletterConsent: form.newsletterConsent,
    });

    setSaving(false);
    if (result.ok) {
      setProfile(result.data);
      toastSuccess("Profile updated", "Your changes have been saved.");
    } else {
      const msg = "error" in result && "message" in result.error ? result.error.message : "Could not save changes.";
      toastError("Update failed", msg);
      if ("error" in result && "errors" in result.error && result.error.errors) {
        const apiErrors: Record<string, string> = {};
        for (const [k, v] of Object.entries(result.error.errors)) {
          apiErrors[k.toLowerCase()] = Array.isArray(v) ? v[0] : String(v);
        }
        setErrors(apiErrors);
      }
    }
  }

  if (loading) return <ProfileSkeleton />;

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <div className="max-w-lg">
      <h1 className="text-h3 font-bold text-foreground mb-6">Profile</h1>

      {/* Read-only info */}
      <div className="rounded-xl border border-border bg-surface p-5 mb-6 flex flex-col gap-2">
        {profile?.email && (
          <div className="flex justify-between text-body-sm">
            <span className="text-foreground-muted">Email</span>
            <span className="text-foreground font-medium">{profile.email}</span>
          </div>
        )}
        {(profile?.firstName || profile?.lastName) && (
          <div className="flex justify-between text-body-sm">
            <span className="text-foreground-muted">Name</span>
            <span className="text-foreground font-medium">
              {[profile.firstName, profile.lastName].filter(Boolean).join(" ")}
            </span>
          </div>
        )}
        <p className="text-caption text-foreground-muted mt-1">
          Name and email are set at registration. Contact support to change them.
        </p>
      </div>

      {/* Editable form */}
      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <Input
          label="Display Name"
          value={form.displayName}
          onChange={set("displayName")}
          error={errors.displayname}
          placeholder="How you'd like to be addressed"
        />

        <Input
          label="Phone Number"
          type="tel"
          value={form.phoneNumber}
          onChange={set("phoneNumber")}
          error={errors.phonenumber}
          autoComplete="tel"
        />

        <Input
          label="Date of Birth"
          type="date"
          value={form.dateOfBirth}
          onChange={set("dateOfBirth")}
          error={errors.dateofbirth}
        />

        {/* Newsletter consent */}
        <div className="flex items-start gap-3 rounded-lg border border-border p-4">
          <input
            id="newsletter"
            type="checkbox"
            checked={form.newsletterConsent}
            onChange={(e) => setForm((f) => ({ ...f, newsletterConsent: e.target.checked }))}
            className="mt-0.5 h-4 w-4 accent-foreground cursor-pointer"
          />
          <label htmlFor="newsletter" className="cursor-pointer">
            <p className="text-body-sm font-medium text-foreground">Marketing emails</p>
            <p className="text-caption text-foreground-muted">
              Receive updates about new arrivals and promotions.
            </p>
          </label>
        </div>

        <Button type="submit" variant="primary" size="md" loading={saving} className="self-start">
          Save Changes
        </Button>
      </form>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="max-w-lg" aria-hidden="true">
      <Skeleton className="h-7 w-28 mb-6" />
      <Skeleton className="h-24 w-full rounded-xl mb-6" />
      <div className="flex flex-col gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-md" />
        ))}
        <Skeleton className="h-10 w-32 rounded-md" />
      </div>
    </div>
  );
}
