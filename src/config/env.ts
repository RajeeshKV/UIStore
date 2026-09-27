/**
 * Kromic Store – Environment Configuration
 *
 * Single source of truth for all environment variables used by the frontend.
 * Validates required variables at import time in development.
 * NEXT_PUBLIC_* vars are the only ones accessible in the browser bundle.
 */

function requireEnv(key: string, devFallback?: string): string {
  const value = process.env[key];
  if (!value) {
    if (process.env.NODE_ENV === "production") {
      // In production builds, missing NEXT_PUBLIC vars become empty string.
      // Log clearly so the issue is visible in Vercel build logs.
      console.error(`[env] MISSING required environment variable: ${key}. Set it in Vercel → Settings → Environment Variables.`);
      return "";
    }
    if (devFallback) {
      console.warn(`[env] ${key} not set, using dev fallback: ${devFallback}`);
      return devFallback;
    }
    return "";
  }
  return value;
}

export const env = {
  /** Base URL of the Kromic Commerce API backend */
  apiUrl: requireEnv("NEXT_PUBLIC_API_URL", "http://localhost:5000"),

  /** Public URL of this frontend application */
  appUrl: requireEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000"),

  /** Current deployment environment */
  environment: requireEnv("NEXT_PUBLIC_ENV", "development") as
    | "development"
    | "staging"
    | "production",

  /** Razorpay public key (secret stays in backend) */
  razorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "",

  isDevelopment: process.env.NODE_ENV === "development",
  isProduction: process.env.NODE_ENV === "production",
} as const;
