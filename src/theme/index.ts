/**
 * Kromic Store – Theme Configuration
 *
 * This is the ONE place to change the visual identity of a customer deployment.
 * All values must map to CSS variable names defined in globals.css.
 * Future themes: swap this config, update globals.css @theme block — zero component edits.
 */

export type ThemeConfig = {
  name: string;
  /** Relative path to logo from /public */
  logo?: string;
  /** Relative path to favicon from /public */
  favicon?: string;
  /** Optional Google Font family name for display/editorial text */
  displayFont?: string;
  /** Optional Google Font family name for body text */
  bodyFont?: string;
};

/**
 * Default theme: Kromic — monochrome black/white/neutral.
 * Product photography always remains colorful.
 */
export const defaultTheme: ThemeConfig = {
  name: "Kromic",
  logo: undefined,
  favicon: undefined,
  displayFont: "Geist",
  bodyFont: "Geist",
};

export { defaultTheme as theme };
