/**
 * Shopey – Environment Configuration
 *
 * NEXT_PUBLIC_* variables are inlined at BUILD TIME by Next.js/Turbopack.
 * They MUST be set in Vercel → Project Settings → Environment Variables
 * before the build runs. Runtime env vars do NOT work for NEXT_PUBLIC_*.
 *
 * Required variables:
 *   NEXT_PUBLIC_API_URL  — backend API base URL (no trailing slash)
 *   NEXT_PUBLIC_APP_URL  — this frontend's canonical URL
 *   NEXT_PUBLIC_ENV      — development | staging | production
 */

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

// Fail the build loudly if the backend URL is missing in production.
// An empty apiUrl causes ALL API calls to hit the frontend origin (/api/v1/...)
// which returns 404s — this is the worst possible silent failure.
if (!apiUrl && process.env.NODE_ENV === "production") {
  throw new Error(
    "\n\n" +
    "========================================================\n" +
    "  MISSING: NEXT_PUBLIC_API_URL environment variable\n" +
    "  Set it in Vercel → Project Settings → Environment Variables\n" +
    "  Value should be your backend API base URL, e.g.:\n" +
    "  https://api.kromic.in\n" +
    "========================================================\n"
  );
}

export const env = {
  /** Base URL of the Kromic Commerce API backend (no trailing slash) */
  apiUrl: apiUrl || "https://api.shopey.tech",

  /** Public URL of this frontend application */
  appUrl: appUrl || "http://localhost:3000",

  /** Current deployment environment */
  environment: (process.env.NEXT_PUBLIC_ENV ?? "development") as
    | "development"
    | "staging"
    | "production",

  isDevelopment: process.env.NODE_ENV === "development",
  isProduction: process.env.NODE_ENV === "production",
} as const;
