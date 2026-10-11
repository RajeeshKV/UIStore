"use client";

/**
 * ProfileClient
 * =============
 * Phone verification behaviour:
 *
 * Case A (SMS disabled / mobileOtpEnabled === false):
 *   - Plain phone field. Save directly via updateProfile. No OTP required.
 *
 * Case B (SMS enabled):
 *   - Phone field shows verified / unverified / pending state.
 *   - If profile has a verified number, it is shown as read-only with a "Change" link.
 *   - Changing the number stages it in pendingPhoneNumber until OTP verified.
 *   - If profile.pendingPhoneNumber is set, show "Pending verification" with a Verify button.
 *   - Saving a NEW phone number in the form does NOT persist it as verified directly —
 *     it goes through the OTP flow first.
 *
 * Address auto-population:
 *   - When the profile has a verified phone + name, pre-fill new address forms with them.
 *   - That is handled at the address-form level (see AddressClient.tsx).
 */

import { useState, useEffect, useCallback } from "react";
import { CheckCircle, XCircle, Phone, AlertCircle } from "lucide-react";
import { customerApi } from "@/services/api/customer";
import { storeApi } from "@/services/api/store";
import { otpApi, normalisePhone } from "@/services/api/otp";
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

  // Whether mobile OTP is enabled for this store
  const [mobileOtpEnabled, setMobileOtpEnabled] = useState(false);

  // Live verification status (only fetched when OTP is enabled)
  const [verifStatus, setVerifStatus] = useState<PhoneVerificationStatusResponse | null>(null);

  // OTP dialog
  const [verifyOpen, setVerifyOpen] = useState(false);

  // Editable form fields
  const [form, setForm] = useState({
    displayName: "",
    phoneNumber: "",
    dateOfBirth: "",
    newsletterConsent: false,
  });

  // Load profile + store settings
  useEffect(() => {
    const init = async () => {
      const [profileRes, settingsRes] = await Promise.all([
        customerApi.getProfile(),
        storeApi.getSettings(),
      ]);

      if (profileRes.ok) {
        const p = profileRes.data;
        setProfile(p);
        setForm({
          displayName: p.displayName ?? "",
          phoneNumber: p.phoneNumber ?? "",
          dateOfBirth: p.dateOfBirth ?? "",
          newsletterConsent: p.newsletterConsent,
        });
      }

      const otpEnabled = settingsRes.ok
        ? (settingsRes.data.auth?.mobileOtpEnabled ?? false)
        : false;
      setMobileOtpEnabled(otpEnabled);

      // Always fetch verification status when user has a phone number — not just when OTP is enabled.
      // The badge shows regardless of whether OTP is required for checkout.
      const p = profileRes.ok ? profileRes.data : null;
      if (p?.phoneNumber) {
        const statusRes = await otpApi.getVerificationStatus();
        if (statusRes.ok) setVerifStatus(statusRes.data);
      }

      setLoading(false);
    };
    void init();
  }, []);

  // Refresh verification status after successful OTP
  const refreshVerifStatus = useCallback(async () => {
    const res = await otpApi.getVerificationStatus();
    if (res.ok) setVerifStatus(res.data);
    // Also re-fetch profile so phoneNumber / pendingPhoneNumber is updated
    const pRes = await customerApi.getProfile();
    if (pRes.ok) {
      setProfile(pRes.data);
      setForm((f) => ({
        ...f,
        phoneNumber: pRes.data.phoneNumber ?? "",
      }));
    }
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrors({});

    // When OTP is enabled: NEVER save phoneNumber directly — it must go through OTP verification.
    // Only save the non-phone fields. Phone is updated by the backend after OTP verify succeeds.
    const payload = mobileOtpEnabled
      ? {
          displayName: form.displayName || undefined,
          dateOfBirth: form.dateOfBirth || undefined,
          newsletterConsent: form.newsletterConsent,
          // phoneNumber intentionally omitted — save only after OTP verification
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

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  // ── Derived phone state ────────────────────────────────────────────────────
  const isVerified = profile?.phoneNumberVerified ?? false;
  // pendingPhoneNumber: if backend staged a new number awaiting OTP
  const pendingPhone = (profile as CustomerProfileResponse & { pendingPhoneNumber?: string })
    ?.pendingPhoneNumber;
  const showVerifyButton =
    mobileOtpEnabled &&
    form.phoneNumber &&
    !isVerified &&
    !pendingPhone;

  const verifiedPhone = isVerified ? profile?.phoneNumber : null;

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
        {/* Verification status badge — shown whenever phone number exists */}
        {profile?.phoneNumber && (
          <div className="flex justify-between text-body-sm items-center pt-1 border-t border-border mt-1">
            <span className="text-foreground-muted">Phone</span>
            <div className="flex items-center gap-2">
              <span className="text-foreground font-medium font-mono">{profile.phoneNumber}</span>
              {isVerified ? (
                <span className="inline-flex items-center gap-1 text-success font-semibold">
                  <CheckCircle className="size-3.5" aria-hidden="true" />
                  Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-warning font-semibold">
                  <XCircle className="size-3.5" aria-hidden="true" />
                  Not verified
                </span>
              )}
            </div>
          </div>
        )}
        <p className="text-caption text-foreground-muted mt-1">
          Name and email are set at registration. Contact support to change them.
        </p>
      </div>

      {/* Pending number banner */}
      {pendingPhone && (
        <div className="rounded-xl border border-warning/30 bg-warning/5 p-4 mb-4 flex items-start gap-3">
          <AlertCircle className="size-4 text-warning shrink-0 mt-0.5" aria-hidden="true" />
          <div className="flex-1">
            <p className="text-body-sm font-medium text-foreground">
              +91 {pendingPhone} — pending verification
            </p>
            <p className="text-caption text-foreground-muted">
              This number will replace your current one after you verify it.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setVerifyOpen(true)}
          >
            <Phone className="size-3.5 mr-1.5" aria-hidden="true" />
            Verify
          </Button>
        </div>
      )}

      {/* Verified number — read-only display with change link */}
      {mobileOtpEnabled && verifiedPhone && (
        <div className="rounded-xl border border-success/20 bg-success/5 px-4 py-3 mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="size-4 text-success shrink-0" aria-hidden="true" />
            <div>
              <p className="text-body-sm font-medium text-foreground">{verifiedPhone}</p>
              <p className="text-caption text-success">Verified mobile number</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setForm((f) => ({ ...f, phoneNumber: normalisePhone(verifiedPhone) }));
              setVerifyOpen(true);
            }}
            className="text-caption text-foreground-muted"
          >
            Change
          </Button>
        </div>
      )}

      {/* Verification prompt (OTP enabled, number exists but unverified) */}
      {mobileOtpEnabled && form.phoneNumber && !isVerified && !pendingPhone && (
        <div
          role="alert"
          className={cn(
            "rounded-xl border px-4 py-3 mb-4 flex items-center justify-between gap-3",
            verifStatus?.verificationRequired
              ? "border-danger/30 bg-danger/5"
              : "border-warning/30 bg-warning/5",
          )}
        >
          <div className="flex items-center gap-2">
            <AlertCircle
              className={cn(
                "size-4 shrink-0",
                verifStatus?.verificationRequired ? "text-danger" : "text-warning",
              )}
              aria-hidden="true"
            />
            <p className="text-body-sm text-foreground">
              {verifStatus?.verificationRequired
                ? "Phone verification required to place orders."
                : "Verify your phone number for a faster checkout experience."}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setVerifyOpen(true)}
          >
            <Phone className="size-3.5 mr-1.5" aria-hidden="true" />
            Verify
          </Button>
        </div>
      )}

      {/* Editable form */}
      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <Input
          label="Display Name"
          value={form.displayName}
          onChange={set("displayName")}
          error={errors.displayname}
          placeholder="How you'd like to be addressed"
        />

        {/* Phone field — behaviour depends on mobileOtpEnabled */}
        {!mobileOtpEnabled ? (
          /* OTP disabled — plain editable field, saved normally */
          <Input
            label="Phone Number"
            type="tel"
            value={form.phoneNumber}
            onChange={set("phoneNumber")}
            error={errors.phonenumber}
            autoComplete="tel"
          />
        ) : !isVerified ? (
          /* OTP enabled, no verified number yet — verify-first flow */
          <div className="flex flex-col gap-1.5">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Input
                  label="Phone Number"
                  type="tel"
                  value={form.phoneNumber}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setForm((f) => ({ ...f, phoneNumber: raw }));
                  }}
                  error={errors.phonenumber}
                  autoComplete="tel"
                  hint="10-digit Indian mobile number"
                  maxLength={10}
                />
              </div>
              {/* Verify button appears once 10 digits are entered */}
              {form.phoneNumber.replace(/\D/g, "").length === 10 && (
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  className="shrink-0 mb-px"
                  onClick={() => setVerifyOpen(true)}
                >
                  <Phone className="size-3.5 mr-1.5" aria-hidden="true" />
                  Verify
                </Button>
              )}
            </div>
            <p className="text-[11px] text-warning">
              ⚠ Phone number is not saved until verified with OTP.
            </p>
          </div>
        ) : null /* verified — shown in the read-only banner above */}

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

      {/* OTP verification dialog */}
      <VerificationDialog
        open={verifyOpen}
        onClose={() => setVerifyOpen(false)}
        onVerified={async (status) => {
          setVerifyOpen(false);

          // Step 4: OTP verified — NOW save the phone number to the profile
          if (mobileOtpEnabled && form.phoneNumber) {
            const saveRes = await customerApi.updateProfile({
              phoneNumber: normalisePhone(form.phoneNumber),
            });
            if (saveRes.ok) {
              setProfile(saveRes.data);
            }
          }

          await refreshVerifStatus();
          toastSuccess(
            "Phone verified",
            `+91 ${status.phoneNumber ?? form.phoneNumber} has been confirmed and saved.`,
          );
        }}
        initialPhone={
          pendingPhone ?? normalisePhone(form.phoneNumber ?? "")
        }
        purpose="PhoneVerification"
        title="Verify your mobile number"
        subtitle="We'll send a 4-digit code to confirm your number."
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
