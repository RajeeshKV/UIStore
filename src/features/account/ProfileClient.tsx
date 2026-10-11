"use client";

/**
 * ProfileClient — Phone verification rules:
 *
 * OTP DISABLED:
 *   - Phone field is editable. Save works normally. No verification required.
 *
 * OTP ENABLED:
 *   - Phone number CANNOT be saved before OTP verification.
 *   - Save Changes button is DISABLED when a new unverified phone is in the field.
 *   - Once 10 digits are typed, a "Verify" button appears inline.
 *   - Clicking Verify opens VerificationDialog (sends OTP, user enters code).
 *   - On successful verification: phone is auto-saved via PUT /customer/profile.
 *   - Verified number is shown read-only with a "Change" option.
 */

import { useState, useEffect, useCallback } from "react";
import { CheckCircle, XCircle, Phone, AlertCircle } from "lucide-react";
import { customerApi } from "@/services/api/customer";
import { storeApi } from "@/services/api/store";
import { otpApi, normalisePhone, isValidIndianMobile } from "@/services/api/otp";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { VerificationDialog } from "@/features/otp/VerificationDialog";
import { extractApiError, cn } from "@/lib/utils";
import type { CustomerProfileResponse, PhoneVerificationStatusResponse } from "@/types/api";

export function ProfileClient() {
  const { success: toastSuccess, error: toastError } = useToast();
  const [profile, setProfile] = useState<CustomerProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [mobileOtpEnabled, setMobileOtpEnabled] = useState(false);
  const [verifStatus, setVerifStatus] = useState<PhoneVerificationStatusResponse | null>(null);
  const [verifyOpen, setVerifyOpen] = useState(false);

  // Saved-to-DB phone (from last successful save/verification)
  const [savedPhone, setSavedPhone] = useState("");

  const [form, setForm] = useState({
    displayName: "",
    phoneNumber: "",
    dateOfBirth: "",
    newsletterConsent: false,
  });

  useEffect(() => {
    const init = async () => {
      const [profileRes, settingsRes] = await Promise.all([
        customerApi.getProfile(),
        storeApi.getSettings(),
      ]);

      if (profileRes.ok) {
        const p = profileRes.data;
        setProfile(p);
        const phone = normalisePhone(p.phoneNumber ?? "");
        setSavedPhone(phone);
        setForm({
          displayName: p.displayName ?? "",
          phoneNumber: phone,
          dateOfBirth: p.dateOfBirth ?? "",
          newsletterConsent: p.newsletterConsent,
        });
      }

      const otpEnabled = settingsRes.ok
        ? (settingsRes.data.auth?.mobileOtpEnabled ?? false)
        : false;
      setMobileOtpEnabled(otpEnabled);

      const p = profileRes.ok ? profileRes.data : null;
      if (p?.phoneNumber) {
        const statusRes = await otpApi.getVerificationStatus();
        if (statusRes.ok) setVerifStatus(statusRes.data);
      }

      setLoading(false);
    };
    void init();
  }, []);

  const refreshVerifStatus = useCallback(async () => {
    const res = await otpApi.getVerificationStatus();
    if (res.ok) setVerifStatus(res.data);
    const pRes = await customerApi.getProfile();
    if (pRes.ok) {
      setProfile(pRes.data);
      const phone = normalisePhone(pRes.data.phoneNumber ?? "");
      setSavedPhone(phone);
      setForm((f) => ({ ...f, phoneNumber: phone }));
    }
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrors({});

    // When OTP is enabled: strip phone from payload — it must be saved via OTP flow only
    const payload = mobileOtpEnabled
      ? {
          displayName: form.displayName || undefined,
          dateOfBirth: form.dateOfBirth || undefined,
          newsletterConsent: form.newsletterConsent,
        }
      : {
          displayName: form.displayName || undefined,
          phoneNumber: form.phoneNumber || undefined,
          dateOfBirth: form.dateOfBirth || undefined,
          newsletterConsent: form.newsletterConsent,
        };

    const result = await customerApi.updateProfile(payload);
    setSaving(false);

    if (result.ok) {
      setProfile(result.data);
      toastSuccess("Profile updated", "Your changes have been saved.");
    } else {
      const msg = extractApiError(result.error, "Could not save changes.");
      toastError("Update failed", msg);
      if ("errors" in result.error && result.error.errors) {
        const apiErrors: Record<string, string> = {};
        for (const [k, v] of Object.entries(result.error.errors)) {
          apiErrors[k.toLowerCase()] = Array.isArray(v) ? v[0] : String(v);
        }
        setErrors(apiErrors);
      }
    }
  }

  if (loading) return <ProfileSkeleton />;

  // ── Derived state ──────────────────────────────────────────────────────────
  const isVerified = profile?.phoneNumberVerified ?? false;
  const typedPhone = normalisePhone(form.phoneNumber);
  const typedPhoneValid = isValidIndianMobile(typedPhone);

  // Phone has changed from what's saved (unsaved new number)
  const phoneChanged = mobileOtpEnabled && typedPhone !== savedPhone && typedPhone !== "";

  // Show inline Verify button when OTP enabled + valid 10-digit number typed + not yet verified for this number
  const showVerifyBtn = mobileOtpEnabled && typedPhoneValid && (phoneChanged || !isVerified);

  // Save is blocked when OTP enabled and phone is changed but not yet verified
  const saveDisabled = mobileOtpEnabled && phoneChanged;

  return (
    <div className="max-w-lg">
      <h1 className="text-h3 font-bold text-foreground mb-6">Profile</h1>

      {/* Read-only info block */}
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
        {savedPhone && (
          <div className="flex justify-between text-body-sm items-center pt-1 border-t border-border mt-1">
            <span className="text-foreground-muted">Phone</span>
            <div className="flex items-center gap-2">
              <span className="text-foreground font-medium font-mono">+91 {savedPhone}</span>
              {isVerified ? (
                <span className="inline-flex items-center gap-1 text-success text-[11px] font-semibold">
                  <CheckCircle className="size-3.5" /> Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-warning text-[11px] font-semibold">
                  <XCircle className="size-3.5" /> Unverified
                </span>
              )}
            </div>
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
          onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
          error={errors.displayname}
          placeholder="How you'd like to be addressed"
        />

        {/* Phone field */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-semibold text-foreground">Phone Number</label>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={form.phoneNumber}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, "").slice(0, 10);
                  setForm((f) => ({ ...f, phoneNumber: raw }));
                }}
                placeholder="10-digit mobile number"
                autoComplete="tel"
                aria-label="Phone number"
                className={cn(
                  "w-full h-11 rounded-md border border-border bg-surface-container px-3 text-[14px] text-foreground",
                  "placeholder:text-foreground-muted",
                  "focus:outline-none focus:bg-surface-elevated focus:border-primary/40 focus:ring-1 focus:ring-primary/10",
                  "transition-colors",
                  errors.phonenumber && "border-danger",
                )}
              />
            </div>

            {/* Verify button — appears when OTP enabled + 10 digits entered */}
            {showVerifyBtn && (
              <Button
                type="button"
                variant="primary"
                size="md"
                className="shrink-0"
                onClick={() => setVerifyOpen(true)}
              >
                <Phone className="size-3.5 mr-1" aria-hidden="true" />
                Verify
              </Button>
            )}

            {/* Verified checkmark — number matches saved verified number */}
            {mobileOtpEnabled && isVerified && typedPhone === savedPhone && (
              <CheckCircle className="size-5 text-success shrink-0" aria-label="Verified" />
            )}
          </div>

          {/* Contextual hint under phone field */}
          {errors.phonenumber && (
            <p className="text-[12px] text-danger">{errors.phonenumber}</p>
          )}
          {mobileOtpEnabled && phoneChanged && (
            <p className="text-[11px] text-warning flex items-center gap-1">
              <AlertCircle className="size-3 shrink-0" />
              Enter the number above and click <strong>Verify</strong> to save it. The number is not saved until verified.
            </p>
          )}
          {mobileOtpEnabled && !isVerified && !phoneChanged && savedPhone && (
            <p className="text-[11px] text-warning flex items-center gap-1">
              <AlertCircle className="size-3 shrink-0" />
              This number is not verified. Click Verify to confirm it.
            </p>
          )}
          {!mobileOtpEnabled && (
            <p className="text-[11px] text-foreground-muted">
              Your contact number for orders and delivery.
            </p>
          )}
        </div>

        <Input
          label="Date of Birth"
          type="date"
          value={form.dateOfBirth}
          onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
          error={errors.dateofbirth}
        />

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

        {/* Save button — disabled when OTP enabled and phone changed but not verified */}
        <div className="flex items-center gap-3">
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={saving}
            disabled={saveDisabled || saving}
            className="self-start"
          >
            Save Changes
          </Button>
          {saveDisabled && (
            <p className="text-[12px] text-warning flex items-center gap-1">
              <AlertCircle className="size-3.5 shrink-0" />
              Verify phone number first
            </p>
          )}
        </div>
      </form>

      {/* OTP verification dialog */}
      <VerificationDialog
        open={verifyOpen}
        onClose={() => setVerifyOpen(false)}
        onVerified={async (status) => {
          setVerifyOpen(false);

          // Auto-save the verified phone number immediately
          const phoneToSave = normalisePhone(form.phoneNumber);
          if (phoneToSave) {
            const saveRes = await customerApi.updateProfile({ phoneNumber: phoneToSave });
            if (saveRes.ok) {
              setProfile(saveRes.data);
              setSavedPhone(phoneToSave);
              setForm((f) => ({ ...f, phoneNumber: phoneToSave }));
            }
          }

          await refreshVerifStatus();
          toastSuccess(
            "Phone verified & saved",
            `+91 ${status.phoneNumber ?? typedPhone} has been confirmed.`,
          );
        }}
        initialPhone={typedPhone}
        purpose="PhoneVerification"
        title="Verify your mobile number"
        subtitle="We'll send a 4-digit OTP to confirm your number."
      />
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
