"use client";

/**
 * VerificationDialog
 * ==================
 * Self-contained phone-verification modal. Manages the full send → enter-code → verify flow.
 *
 * Props:
 *  open            – whether the dialog is shown
 *  onClose         – called when the user dismisses (cancels); does NOT unblock checkout
 *  onVerified      – called after a successful verify + re-fetch of verification-status;
 *                    caller should re-evaluate their gate after this fires
 *  initialPhone    – pre-fill the phone field (e.g. from profile or address)
 *  purpose         – OtpPurpose (default "PhoneVerification")
 *  title / subtitle – override defaults
 *
 * State machine:
 *   phone  → sending → code → verifying → verified
 *                ↕              ↕
 *            error          error
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { CheckCircle, Phone, RefreshCw } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { OtpInput } from "@/components/ui/OtpInput";
import { otpApi, isValidIndianMobile, normalisePhone, maskPhone, describeOtpError } from "@/services/api/otp";
import type { OtpPurpose, PhoneVerificationStatusResponse } from "@/types/api";
import { cn } from "@/lib/utils";

// ── Countdown hook ────────────────────────────────────────────────────────────

function useCountdown(targetUtc: string | null): number {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!targetUtc) { setRemaining(0); return; }

    function tick() {
      const ms = new Date(targetUtc!).getTime() - Date.now();
      setRemaining(Math.max(0, Math.ceil(ms / 1000)));
    }

    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [targetUtc]);

  return remaining;
}

function formatSeconds(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

// ── Session storage helpers ───────────────────────────────────────────────────
// Persist OTP session timestamps across page reloads.
// NEVER store the OTP code itself.

const SESSION_KEY = "kromic_otp_session";

interface OtpSession {
  phone: string;
  purpose: OtpPurpose;
  sentAt: string;
  expiresAt: string;
  resendAt: string;
}

const otpSession = {
  save(s: OtpSession) {
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch { /* ignore */ }
  },
  load(): OtpSession | null {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? (JSON.parse(raw) as OtpSession) : null;
    } catch { return null; }
  },
  clear() {
    try { sessionStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
  },
};

// ── Types ─────────────────────────────────────────────────────────────────────

type VerifyStep = "phone" | "sending" | "code" | "verifying" | "verified";

interface VerificationDialogProps {
  open: boolean;
  onClose: () => void;
  /** Fired after successful verify + status re-fetch. Receives fresh status. */
  onVerified: (status: PhoneVerificationStatusResponse) => void;
  initialPhone?: string;
  purpose?: OtpPurpose;
  title?: string;
  subtitle?: string;
  /** When true, hides the close / cancel button (blocking checkout gate). */
  blocking?: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function VerificationDialog({
  open,
  onClose,
  onVerified,
  initialPhone = "",
  purpose = "PhoneVerification",
  title = "Verify your mobile number",
  subtitle = "We'll send a 4-digit code to confirm your number.",
  blocking = false,
}: VerificationDialogProps) {
  const [step, setStep] = useState<VerifyStep>("phone");

  // Phone field
  const [phone, setPhone] = useState(normalisePhone(initialPhone));
  const [phoneLocked, setPhoneLocked] = useState(false);
  const [phoneError, setPhoneError] = useState("");

  // OTP field
  const [otp, setOtp] = useState("");
  const [otpLength, setOtpLength] = useState(4);
  const [otpError, setOtpError] = useState("");
  const [submitLocked, setSubmitLocked] = useState(false);

  // Banner error (non-field)
  const [bannerError, setBannerError] = useState("");
  const [bannerNeutral, setBannerNeutral] = useState("");
  const [flowDisabled, setFlowDisabled] = useState(false);

  // Timestamps (from send response)
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [resendAt, setResendAt] = useState<string | null>(null);

  const expiryRemaining = useCountdown(expiresAt);
  const resendRemaining = useCountdown(resendAt);

  // Guard: prevent double-sends/verify
  const inFlight = useRef(false);

  // ── Restore session on mount if dialog opens mid-flow ─────────────────────
  useEffect(() => {
    if (!open) return;
    const saved = otpSession.load();
    if (saved && saved.purpose === purpose) {
      const expiresMs = new Date(saved.expiresAt).getTime() - Date.now();
      if (expiresMs > 0) {
        // Session is still live — restore into code-entry step
        setPhone(saved.phone);
        setPhoneLocked(true);
        setExpiresAt(saved.expiresAt);
        setResendAt(saved.resendAt);
        setStep("code");
        return;
      }
    }
    // Fresh open
    setPhone(normalisePhone(initialPhone));
    setStep("phone");
    setPhoneLocked(false);
    resetErrors();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function resetErrors() {
    setPhoneError("");
    setOtpError("");
    setBannerError("");
    setBannerNeutral("");
    setSubmitLocked(false);
    setFlowDisabled(false);
  }

  // ── Send OTP ───────────────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    if (inFlight.current || flowDisabled) return;

    resetErrors();

    if (!isValidIndianMobile(phone)) {
      setPhoneError("Enter a valid 10-digit Indian mobile number.");
      return;
    }

    inFlight.current = true;
    setStep("sending");

    const res = await otpApi.send({ phoneNumber: normalisePhone(phone), purpose });
    inFlight.current = false;

    if (res.ok) {
      setExpiresAt(res.data.expiresAtUtc);
      setResendAt(res.data.resendAvailableAtUtc);
      setPhoneLocked(true);
      setOtp("");
      setStep("code");

      // Try to get otpLength from verification-status — but don't block on it.
      // Fall back to 4 (the default) if the call fails or returns 0.
      otpApi.getVerificationStatus().then((statusRes) => {
        if (statusRes.ok) {
          const len = statusRes.data.otpLength;
          if (len && len > 0) setOtpLength(len);
        }
      });

      otpSession.save({
        phone: normalisePhone(phone),
        purpose,
        sentAt: new Date().toISOString(),
        expiresAt: res.data.expiresAtUtc,
        resendAt: res.data.resendAvailableAtUtc,
      });
    } else {
      // A send failure does NOT consume cooldown — return to phone step
      setStep("phone");
      const err = res.error;
      const code = "code" in err ? (err as { code?: string }).code : undefined;
      const desc = describeOtpError("status" in err ? (err as { status: number }).status : 500, code);

      if (desc.tone === "field-phone") setPhoneError(desc.text);
      else if (desc.tone === "disable-flow") { setBannerError(desc.text); setFlowDisabled(true); }
      else if (desc.tone === "banner-neutral") setBannerNeutral(desc.text);
      else setBannerError(desc.text);
    }
  }, [phone, purpose, flowDisabled]);

  // ── Verify OTP ─────────────────────────────────────────────────────────────
  const handleVerify = useCallback(async () => {
    if (inFlight.current || submitLocked || flowDisabled) return;
    if (otp.replace(/\D/g, "").length < otpLength) {
      setOtpError(`Enter the ${otpLength}-digit code.`);
      return;
    }

    resetErrors();
    inFlight.current = true;
    setStep("verifying");

    const res = await otpApi.verify({
      phoneNumber: normalisePhone(phone),
      otp: otp.replace(/\D/g, ""),
      purpose,
    });
    inFlight.current = false;

    if (res.ok) {
      // 204 success — clear session, re-fetch status
      otpSession.clear();
      setStep("verified");

      const statusRes = await otpApi.getVerificationStatus();
      if (statusRes.ok) {
        onVerified(statusRes.data);
      }
    } else {
      setStep("code");
      const err = res.error;
      const code = "code" in err ? (err as { code?: string }).code : undefined;
      const status = "status" in err ? (err as { status: number }).status : 500;

      // Show expiry copy if our local timer hit zero
      const isExpired = expiryRemaining === 0;
      const desc = describeOtpError(status, isExpired && code === "OTP_INVALID" ? "OTP_INVALID" : code);

      // OTP_INVALID when expired — show expiry-specific copy
      if (isExpired && code === "OTP_INVALID") {
        setBannerNeutral("Your code has expired. Request a new one.");
        setOtp("");
      } else if (code === "PHONE_VERIFICATION_NOT_PENDING") {
        // The pending number was changed while this dialog was open.
        // Drop back to the phone step so the user can start a fresh flow.
        setBannerNeutral(desc.text);
        setPhoneLocked(false);
        setOtp("");
        setStep("phone");
      } else if (desc.tone === "field-otp") {
        setOtpError(desc.text);
        if (code !== "OTP_MAX_ATTEMPTS") setOtp("");
      } else if (desc.tone === "disable-flow") {
        setBannerError(desc.text);
        setFlowDisabled(true);
      } else if (desc.tone === "banner-neutral") {
        setBannerNeutral(desc.text);
      } else {
        setBannerError(desc.text);
      }

      if (desc.lockSubmit) setSubmitLocked(true);
    }
  }, [otp, phone, purpose, otpLength, submitLocked, flowDisabled, expiryRemaining, onVerified]);

  // ── Resend ─────────────────────────────────────────────────────────────────
  const handleResend = useCallback(async () => {
    if (resendRemaining > 0 || inFlight.current || flowDisabled) return;
    resetErrors();
    setOtp("");
    setSubmitLocked(false);
    setPhoneLocked(false);
    // Go back to phone step to re-trigger a fresh send
    setStep("phone");
    // Auto-send
    await handleSend();
  }, [resendRemaining, flowDisabled, handleSend]);

  const canSend = isValidIndianMobile(phone) && !flowDisabled;
  const isSending = step === "sending";
  const isVerifying = step === "verifying";
  const showCode = step === "code" || step === "verifying";
  const isVerified = step === "verified";

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Modal
      open={open}
      onClose={blocking ? () => {} : onClose}
      title={title}
      description={subtitle}
      hideClose={blocking}
      size="max-w-sm"
    >
      {isVerified ? (
        // ── Success state ──────────────────────────────────────────────────
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/10">
            <CheckCircle className="size-7 text-success" />
          </div>
          <div>
            <p className="text-body font-semibold text-foreground">Number verified</p>
            <p className="text-body-sm text-foreground-muted mt-1">
              Your mobile number has been confirmed.
            </p>
          </div>
          <Button variant="primary" size="md" onClick={onClose} className="mt-2 w-full">
            Continue
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-5">

          {/* Banner — flow disabled (SMS_NOT_CONFIGURED, 429) */}
          {bannerError && (
            <div
              role="alert"
              className="rounded-md bg-danger/5 border border-danger/20 px-4 py-3 text-body-sm text-danger"
            >
              {bannerError}
            </div>
          )}

          {/* Banner — neutral (cooldown, expiry) */}
          {bannerNeutral && !bannerError && (
            <div className="rounded-md bg-muted border border-border px-4 py-3 text-body-sm text-foreground-muted">
              {bannerNeutral}
            </div>
          )}

          {/* Phone input */}
          <PhoneInput
            label="Mobile number"
            value={phone}
            onChange={setPhone}
            error={phoneError}
            disabled={isSending || isVerifying || flowDisabled}
            locked={phoneLocked && showCode}
            onUnlock={() => {
              setPhoneLocked(false);
              setStep("phone");
              setExpiresAt(null);
              setResendAt(null);
              setOtp("");
              otpSession.clear();
              resetErrors();
            }}
            required
            hint={!phoneLocked ? "Indian numbers only (+91)." : undefined}
          />

          {/* Code entry section */}
          {showCode && (
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-body-sm font-medium text-foreground mb-1">
                  Enter the code sent to{" "}
                  <span className="font-mono">
                    {maskPhone(phone)}
                  </span>
                </p>
                {expiryRemaining > 0 && (
                  <p className="text-caption text-foreground-muted">
                    Code expires in{" "}
                    <span
                      className={cn(
                        "font-mono font-medium",
                        expiryRemaining < 60 ? "text-warning" : "text-foreground",
                      )}
                    >
                      {formatSeconds(expiryRemaining)}
                    </span>
                  </p>
                )}
                {expiryRemaining === 0 && (
                  <p className="text-caption text-warning">Code has expired. Request a new one.</p>
                )}
              </div>

              <OtpInput
                length={otpLength}
                value={otp}
                onChange={setOtp}
                disabled={isVerifying || submitLocked || flowDisabled}
                error={!!otpError || expiryRemaining === 0}
                autoFocus
              />

              {otpError && (
                <p role="alert" className="text-caption text-danger -mt-2">
                  {otpError}
                </p>
              )}

              {/* Resend row */}
              <div className="flex items-center gap-2 text-caption text-foreground-muted">
                <span>Didn't receive it?</span>
                {resendRemaining > 0 ? (
                  <span>
                    Resend in{" "}
                    <span className="font-mono font-medium text-foreground">
                      {formatSeconds(resendRemaining)}
                    </span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={isSending || isVerifying || flowDisabled}
                    className={cn(
                      "text-primary underline underline-offset-2 hover:no-underline transition-all",
                      "disabled:opacity-50 disabled:pointer-events-none",
                    )}
                  >
                    <RefreshCw className="inline size-3 mr-1" aria-hidden="true" />
                    Resend code
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2">
            {!showCode ? (
              <Button
                type="button"
                variant="primary"
                size="md"
                fullWidth
                loading={isSending}
                disabled={!canSend || isSending}
                onClick={handleSend}
              >
                <Phone className="size-4 mr-2" aria-hidden="true" />
                Send code
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                size="md"
                fullWidth
                loading={isVerifying}
                disabled={
                  isVerifying ||
                  submitLocked ||
                  flowDisabled ||
                  expiryRemaining === 0 ||
                  otp.replace(/\D/g, "").length < otpLength
                }
                onClick={handleVerify}
              >
                Verify
              </Button>
            )}

            {!blocking && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                fullWidth
                onClick={onClose}
                disabled={isSending || isVerifying}
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
