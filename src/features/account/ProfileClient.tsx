"use client";

/**
 * ProfileClient - Phone field rules:
 *
 * OTP DISABLED (mobileOtpEnabled = false):
 *   - Phone field behaves like any other field (displayName, DOB).
 *   - Save Changes is enabled only when at least one field has changed from saved values.
 *   - Phone is included in the Save payload directly.
 *
 * OTP ENABLED (mobileOtpEnabled = true):
 *   - Phone field triggers a verify-first flow.
 *   - Save Changes is DISABLED when phone field has been changed but not verified.
 *   - Save Changes is enabled only when non-phone fields are dirty OR phone was just verified.
 *   - When 10 valid digits are entered, "Verify" button appears inline.
 *   - Verify click → POST /otp/check-availability → if not available, show error, stop.
 *   - If available → POST /otp/send → open VerificationDialog.
 *   - On OTP success → POST /customer/profile { phoneNumber } auto-saves immediately.
 *   - Verified number shown read-only with green check + "Change" option.
 *
 * Save button:
 *   - Starts DISABLED (no changes on mount).
 *   - Enabled when: (non-phone fields dirty) OR (phone just verified in this session).
 *   - When OTP enabled: disabled again if phone field changes after last verification.
 */

import { useState, useEffect, useCallback, useRef } from "react";
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
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");

  // Snapshot of what's in the DB - used for dirty detection
  const savedRef = useRef({ displayName: "", phoneNumber: "", dateOfBirth: "", newsletterConsent: false });

  const [form, setForm] = useState({
    displayName: "",
    phoneNumber: "",
    dateOfBirth: "",
    newsletterConsent: false,
  });

  // Track whether phone was verified in this session (enables Save after OTP success)
  const [phoneJustVerified, setPhoneJustVerified] = useState(false);

  useEffect(() => {
    const init = async () => {
      const [profileRes, settingsRes] = await Promise.all([
        customerApi.getProfile(),
        storeApi.getSettings(),
      ]);

      if (profileRes.ok) {
        const p = profileRes.data;
        setProfile(p);
        const snap = {
          displayName: p.displayName ?? "",
          phoneNumber: normalisePhone(p.phoneNumber ?? ""),
          dateOfBirth: p.dateOfBirth ?? "",
          newsletterConsent: p.newsletterConsent,
        };
        savedRef.current = snap;
        setForm(snap);
      }

      setMobileOtpEnabled(settingsRes.ok ? (settingsRes.data.auth?.mobileOtpEnabled ?? false) : false);
      setLoading(false);
    };
    void init();
  }, []);

  const refreshProfile = useCallback(async () => {
    const pRes = await customerApi.getProfile();
    if (pRes.ok) {
      setProfile(pRes.data);
      const snap = {
        displayName: pRes.data.displayName ?? "",
        phoneNumber: normalisePhone(pRes.data.phoneNumber ?? ""),
        dateOfBirth: pRes.data.dateOfBirth ?? "",
        newsletterConsent: pRes.data.newsletterConsent,
      };
      savedRef.current = snap;
      setForm(snap);
    }
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrors({});

    const payload = mobileOtpEnabled
      ? {
          // OTP enabled: never save phone here - it's saved after OTP verification
          displayName: form.displayName || undefined,
          dateOfBirth: form.dateOfBirth || undefined,
          newsletterConsent: form.newsletterConsent,
        }
      : {
          // OTP disabled: phone is a normal field
          displayName: form.displayName || undefined,
          phoneNumber: form.phoneNumber || undefined,
          dateOfBirth: form.dateOfBirth || undefined,
          newsletterConsent: form.newsletterConsent,
        };

    const result = await customerApi.updateProfile(payload);
    setSaving(false);

    if (result.ok) {
      setProfile(result.data);
      const snap = {
        displayName: result.data.displayName ?? "",
        phoneNumber: normalisePhone(result.data.phoneNumber ?? ""),
        dateOfBirth: result.data.dateOfBirth ?? "",
        newsletterConsent: result.data.newsletterConsent,
      };
      savedRef.current = snap;
      setPhoneJustVerified(false);
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

  async function handleVerifyClick() {
    setAvailabilityError("");
    setCheckingAvailability(true);

    // Step 1: check availability - is this number already linked to another account?
    const availRes = await otpApi.checkAvailability({ phoneNumber: normalisePhone(form.phoneNumber) });
    setCheckingAvailability(false);

    if (!availRes.ok) {
      // Network / server error - try to proceed anyway (backend will reject during send if taken)
      setVerifyOpen(true);
      return;
    }

    if (!availRes.data.available) {
      setAvailabilityError(
        availRes.data.reason ?? "This number is already linked to another account. Use a different number.",
      );
      return;
    }

    // Step 2: number is available - open verification dialog (it calls /otp/send internally)
    setVerifyOpen(true);
  }

  if (loading) return <ProfileSkeleton />;

  // ── Derived state ──────────────────────────────────────────────────────────
  const saved = savedRef.current;
  const isVerified = profile?.phoneNumberVerified ?? false;
  const typedPhone = normalisePhone(form.phoneNumber);
  const typedPhoneValid = isValidIndianMobile(typedPhone);

  // Has the user changed any non-phone field?
  const nonPhoneDirty =
    form.displayName !== saved.displayName ||
    form.dateOfBirth !== saved.dateOfBirth ||
    form.newsletterConsent !== saved.newsletterConsent;

  // Has the phone field changed from what's saved in DB?
  const phoneFieldChanged = typedPhone !== saved.phoneNumber;

  // Show inline Verify button: OTP enabled + 10 valid digits + phone is different from saved
  const showVerifyBtn = mobileOtpEnabled && typedPhoneValid && (phoneFieldChanged || !isVerified);

  // Save button enablement rules:
  // - OTP disabled: enabled when any field is dirty (including phone)
  // - OTP enabled:
  //     • Disabled when phone changed but not yet verified in this session
  //     • Enabled when (non-phone fields dirty) OR (phone just verified)
  const phoneDirtyUnverified = mobileOtpEnabled && phoneFieldChanged && !phoneJustVerified;
  const hasNonPhoneChanges = mobileOtpEnabled
    ? nonPhoneDirty || phoneJustVerified
    : nonPhoneDirty || form.phoneNumber !== saved.phoneNumber;
  const saveEnabled = hasNonPhoneChanges && !phoneDirtyUnverified;

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
        {saved.phoneNumber && (
          <div className="flex justify-between text-body-sm items-center pt-1 border-t border-border mt-1">
            <span className="text-foreground-muted">Phone</span>
            <div className="flex items-center gap-2">
              <span className="text-foreground font-medium font-mono">+91 {saved.phoneNumber}</span>
              {isVerified ? (
                <span className="inline-flex items-center gap-1 text-success text-[11px] font-semibold">
                  <CheckCircle className="size-3.5" /> Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-warning text-[11px] font-semibold">
                  <XCircle className="size-3.5" /> Not verified
                </span>
              )}
            </div>
          </div>
        )}
        <p className="text-caption text-foreground-muted mt-1">
          Name and email are set at registration. Contact support to change them.
        </p>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <Input
          label="Display Name"
          value={form.displayName}
          onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
          error={errors.displayname}
          placeholder="How you'd like to be addressed"
        />

        {/* ── Phone field ─────────────────────────────────────────────────── */}
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
                  setAvailabilityError("");
                  setPhoneJustVerified(false);
                }}
                placeholder="10-digit mobile number"
                autoComplete="tel"
                className={cn(
                  "w-full h-11 rounded-md border border-border bg-surface-container px-3 text-[14px] text-foreground",
                  "placeholder:text-foreground-muted transition-colors",
                  "focus:outline-none focus:bg-surface-elevated focus:border-primary/40 focus:ring-1 focus:ring-primary/10",
                  availabilityError && "border-danger",
                )}
              />
            </div>

            {/* Verify button */}
            {showVerifyBtn && (
              <Button
                type="button"
                variant="primary"
                size="md"
                className="shrink-0"
                loading={checkingAvailability}
                disabled={checkingAvailability}
                onClick={() => void handleVerifyClick()}
              >
                {!checkingAvailability && <Phone className="size-3.5 mr-1" aria-hidden="true" />}
                Verify
              </Button>
            )}

            {/* Green check - phone matches saved verified number */}
            {mobileOtpEnabled && isVerified && !phoneFieldChanged && (
              <CheckCircle className="size-5 text-success shrink-0" aria-label="Verified" />
            )}
          </div>

          {availabilityError && (
            <p className="text-[12px] text-danger flex items-center gap-1" role="alert">
              <AlertCircle className="size-3 shrink-0" />{availabilityError}
            </p>
          )}
          {mobileOtpEnabled && phoneFieldChanged && !phoneJustVerified && typedPhoneValid && (
            <p className="text-[11px] text-warning flex items-center gap-1">
              <AlertCircle className="size-3 shrink-0" />
              Click <strong>Verify</strong> to confirm this number. It won&apos;t be saved until verified.
            </p>
          )}
          {mobileOtpEnabled && !isVerified && !phoneFieldChanged && saved.phoneNumber && (
            <p className="text-[11px] text-warning flex items-center gap-1">
              <AlertCircle className="size-3 shrink-0" />
              Phone number not yet verified. Click Verify to confirm it.
            </p>
          )}
          {!mobileOtpEnabled && (
            <p className="text-[11px] text-foreground-muted">Your contact number for orders and delivery.</p>
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
            <p className="text-caption text-foreground-muted">Receive updates about new arrivals and promotions.</p>
          </label>
        </div>

        {/* Save button */}
        <div className="flex items-center gap-3">
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={saving}
            disabled={!saveEnabled || saving}
            className="self-start"
          >
            Save Changes
          </Button>
          {phoneDirtyUnverified && (
            <p className="text-[12px] text-warning flex items-center gap-1">
              <AlertCircle className="size-3.5 shrink-0" />
              Verify phone number first to save
            </p>
          )}
        </div>
      </form>

      <VerificationDialog
        open={verifyOpen}
        onClose={() => setVerifyOpen(false)}
        onVerified={async (status) => {
          setVerifyOpen(false);
          // Auto-save the verified phone number to profile
          const phoneToSave = normalisePhone(form.phoneNumber);
          if (phoneToSave) {
            const saveRes = await customerApi.updateProfile({ phoneNumber: phoneToSave });
            if (saveRes.ok) {
              const snap = { ...savedRef.current, phoneNumber: phoneToSave };
              savedRef.current = snap;
              setProfile(saveRes.data);
              setForm((f) => ({ ...f, phoneNumber: phoneToSave }));
              setPhoneJustVerified(true);
            }
          }
          await refreshProfile();
          toastSuccess("Phone verified & saved", `+91 ${status.phoneNumber ?? typedPhone} confirmed.`);
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
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-md" />)}
        <Skeleton className="h-10 w-32 rounded-md" />
      </div>
    </div>
  );
}
