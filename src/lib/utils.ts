import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind class names safely — clsx handles conditionals, twMerge
 * resolves conflicting Tailwind utilities (e.g. p-2 overriding px-3).
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
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
