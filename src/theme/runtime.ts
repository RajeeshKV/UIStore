/** Returns a resolved CSS color token for browser based integrations. */
export function getThemeColor(token: "primary" | "primary-foreground" = "primary") {
  if (typeof window === "undefined") return "#000000";
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(`--color-${token}`)
    .trim();
  return value || "#000000";
}
