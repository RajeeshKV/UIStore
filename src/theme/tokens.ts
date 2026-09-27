/**
 * Kromic Store – Design Tokens
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
] as const;

export type ColorToken = (typeof colorTokens)[number];
