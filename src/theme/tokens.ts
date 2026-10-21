/**
 * Shopey – Design Tokens
 *
 * Semantic token names. Values live in globals.css as CSS variables.
 * Components consume these string keys via Tailwind utilities (e.g. `bg-background`).
 * Never import hex values from here into components.
 */

export const colorTokens = [
  "background",
  "surface",
  "surface-elevated",
  "foreground",
  "foreground-muted",
  "border",
  "border-strong",
  "primary",
  "primary-foreground",
  "secondary",
  "secondary-foreground",
  "accent",
  "accent-foreground",
  "muted",
  "muted-foreground",
  "success",
  "success-foreground",
  "warning",
  "warning-foreground",
  "danger",
  "danger-foreground",
  "focus",
  "admin-background",
  "admin-surface",
  "admin-surface-subtle",
  "admin-foreground",
  "admin-foreground-muted",
  "admin-border",
  "control-background",
  "control-border",
  "control-hover",
  "focus-ring",
  "rating",
] as const;

export const typographyTokens = ["sans", "display", "mono"] as const;
export const radiusTokens = ["control", "card", "panel"] as const;
export const elevationTokens = ["card", "overlay"] as const;
export const motionTokens = ["duration-fast", "duration-base", "duration-slow", "ease-out-smooth"] as const;

export type ColorToken = (typeof colorTokens)[number];
