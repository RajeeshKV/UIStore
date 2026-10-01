/**
 * OTP / Phone Verification API
 * Endpoints verified against api-documentation.json.
 *
 * POST /otp/send    — auth optional; works for anonymous and authenticated callers.
 *                     When authenticated, a successful verify binds the number to the account.
 * POST /otp/verify  — returns 204 No Content on success.
 * GET  /otp/verification-status — requires auth; single source of truth for checkout gate.
 */
import { apiClient } from "./client";
import type {
  OtpSendRequest,
  OtpSendResponse,
  OtpVerifyRequest,
  PhoneVerificationStatusResponse,
} from "@/types/api";

// Indian mobile number validation — mirrors the backend's SmsPhoneNumber.TryToNational.
// Exactly 10 digits, first digit 6–9.
const NATIONAL_MOBILE_RE = /^[6-9]\d{9}$/;

/** Strip non-digit characters and remove a leading 91 country code if present. */
export function normalisePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  // Strip leading 91 only when total length would be 12 (91 + 10 digits)
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  return digits;
}

export function isValidIndianMobile(raw: string): boolean {
  return NATIONAL_MOBILE_RE.test(normalisePhone(raw));
}

/** Format a national 10-digit number as "98765 43210" for display only. */
export function formatIndianMobile(national: string): string {
  const d = normalisePhone(national);
  if (d.length !== 10) return d;
  return `${d.slice(0, 5)} ${d.slice(5)}`;
}

/** Mask a national or E.164 number: +91 98765 ••••10 */
export function maskPhone(phone: string): string {
  const d = normalisePhone(phone);
  if (d.length !== 10) return phone;
  return `+91 ${d.slice(0, 5)} ••••${d.slice(-2)}`;
}

export const otpApi = {
  /**
   * POST /api/v1/otp/send
   * Rate limited: 5 req / 60 s per IP.
   * Auth optional — works for anonymous callers too.
   */
  send: (data: OtpSendRequest) =>
    apiClient.post<OtpSendResponse>("/api/v1/otp/send", data),

  /**
   * POST /api/v1/otp/verify
   * Returns 204 No Content on success (no body).
   * Rate limited — shares budget with send.
   */
  verify: (data: OtpVerifyRequest) =>
    apiClient.post<void>("/api/v1/otp/verify", data),

  /**
   * GET /api/v1/otp/verification-status
   * Requires authentication.
   * verificationSatisfied is the single gate for checkout.
   */
  getVerificationStatus: () =>
    apiClient.get<PhoneVerificationStatusResponse>("/api/v1/otp/verification-status"),
};

// ── OTP error code map ────────────────────────────────────────────────────────

export type OtpErrorTone = "field-otp" | "field-phone" | "banner-neutral" | "banner-error" | "disable-flow";

export interface OtpErrorDescriptor {
  tone: OtpErrorTone;
  text: string;
  lockSubmit?: boolean;
}

export function describeOtpError(
  status: number,
  code: string | undefined,
): OtpErrorDescriptor {
  if (status === 429) {
    return {
      tone: "disable-flow",
      text: "Too many attempts. Please try again shortly.",
      lockSubmit: true,
    };
  }

  switch (code) {
    case "VALIDATION_SUBMITTEDOTP":
      return { tone: "field-otp", text: "Enter the 4-digit code." };
    case "VALIDATION_PHONENUMBER":
      return { tone: "field-phone", text: "Enter a valid mobile number." };
    case "OTP_INVALID":
      return { tone: "field-otp", text: "That code is not correct. Check it and try again." };
    case "OTP_MAX_ATTEMPTS":
      return { tone: "field-otp", text: "Too many incorrect attempts. Request a new code.", lockSubmit: true };
    case "INVALID_PHONE_NUMBER":
      return { tone: "field-phone", text: "Enter a valid 10-digit Indian mobile number." };
    case "OTP_COOLDOWN":
      return { tone: "banner-neutral", text: "You can request another code shortly." };
    case "OTP_SEND_FAILED":
      return { tone: "banner-error", text: "We couldn't send the code. Please try again." };
    case "SMS_NOT_CONFIGURED":
      return {
        tone: "disable-flow",
        text: "Verification codes are unavailable right now. Please contact support.",
      };
    default:
      return { tone: "banner-error", text: "Something went wrong. Please try again." };
  }
}
