import { defaultTheme, isThemeId } from "@/theme";

/** Resolve the fixed production theme for this customer deployment. */
export function getConfiguredStoreTheme() {
  const configured = process.env.SHOPEY_STORE_THEME;
  return isThemeId(configured) ? configured : defaultTheme.id;
}
