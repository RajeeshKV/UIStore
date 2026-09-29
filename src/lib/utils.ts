/**
 * Utility helpers
 */

/** Merge class names (replaces clsx/cn for simple use). */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

/** Format a price number to locale currency string. */
export function formatPrice(
  amount: number,
  currency = "INR",
  locale = "en-IN",
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Calculate discount percentage */
export function discountPercent(price: number, compareAt: number): number {
  if (compareAt <= price) return 0;
  return Math.round(((compareAt - price) / compareAt) * 100);
}

/** Truncate text to max length with ellipsis */
export function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max).trimEnd() + "…" : text;
}

/**
 * Extract a human-readable error message from any ApiResult error.
 * Falls back to a generic support message if nothing meaningful is available.
 *
 * Usage:
 *   const msg = extractApiError(result.error);
 *   toastError("Action failed", msg);
 */
export function extractApiError(
  error: { message?: string } | null | undefined,
  fallback = "Something went wrong. Please try again or contact support.",
): string {
  if (!error) return fallback;
  const msg = "message" in error ? (error as { message?: string }).message : undefined;
  return msg?.trim() || fallback;
}

/**
 * Safe extractor for Promise.allSettled results.
 * Returns the data if the promise fulfilled and the API call succeeded,
 * otherwise returns the provided fallback.
 *
 * Handles the Vercel build-time case where the backend is unreachable:
 * - If rejected: returns fallback
 * - If fulfilled but API error: returns fallback
 * - If fulfilled and API ok but data is null/undefined: returns fallback
 */
export function safeData<T>(
  result: PromiseSettledResult<{ ok: true; data: T } | { ok: false; error: unknown }>,
  fallback: T,
): T {
  if (result.status !== "fulfilled") return fallback;
  if (!result.value.ok) return fallback;
  const data = (result.value as { ok: true; data: T }).data;
  return data ?? fallback;
}
