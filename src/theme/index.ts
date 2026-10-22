/**
 * Shopey – Theme Configuration
 *
 * This is the ONE place to change the visual identity of a customer deployment.
 * All values must map to CSS variable names defined in globals.css.
 * Future themes: swap this config, update globals.css @theme block - zero component edits.
 */

export type ThemeConfig = {
  /** Stable theme ID; CSS theme overrides use the same root data-theme value. */
  id: ThemeId;
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

export type ThemeFamily = "dark" | "mild-dark" | "mid-tone" | "mild-light" | "bright-light";
export const themeCatalog = [
  { id: "default", name: "Swiss Modern", family: "bright-light", swatch: "#171a1d", description: "Precision grid, crisp surfaces, quiet editorial merchandising." },
  { id: "luxe", name: "Obsidian Luxury", family: "dark", swatch: "#c7a46b", description: "Near-black boutique with cinematic product storytelling." },
  { id: "starbucks", name: "Coffeehouse", family: "mid-tone", swatch: "#006241", description: "Warm stone, relaxed spacing, soft rounded shopping surfaces." },
  { id: "levis", name: "Bold Contemporary", family: "bright-light", swatch: "#17365d", description: "Strong geometry and oversized campaign typography." },
  { id: "ikea", name: "Vibrant Retail", family: "bright-light", swatch: "#0058a3", description: "Compact catalog with high-visibility campaign accents." },
  { id: "sephora", name: "Soft Premium", family: "mild-light", swatch: "#b77b83", description: "Porcelain boutique, rounded cards, quiet elevated details." },
  { id: "patagonia", name: "Earthy Organic", family: "mid-tone", swatch: "#234c3b", description: "Sage-and-clay storefront with organic forms and calm rhythm." },
  { id: "tiffany", name: "Editorial Minimal", family: "mild-light", swatch: "#0f6f68", description: "Magazine-like layout with image-led stories and fine type." },
  { id: "adidas", name: "Graphite Modern", family: "mild-dark", swatch: "#111111", description: "Dense graphite utility with crisp technical merchandising." },
  { id: "coca-cola", name: "Pop Retail", family: "bright-light", swatch: "#e8002d", description: "High-energy promotional blocks with bold price-first cards." },
  { id: "amazon", name: "Midnight Tech", family: "dark", swatch: "#55d6ff", description: "Blue-black technology store with efficient utility navigation." },
  { id: "dior", name: "Couture Editorial", family: "mild-light", swatch: "#b49a70", description: "High-fashion editorial storefront with dramatic type and whitespace." },
] as const satisfies readonly { id: string; name: string; family: ThemeFamily; swatch: string; description: string }[];

export type ThemeId = (typeof themeCatalog)[number]["id"];

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === "string" && themeCatalog.some((theme) => theme.id === value);
}

/**
 * Default theme: Kromic - monochrome black/white/neutral.
 * Product photography always remains colorful.
 */
export const defaultTheme: ThemeConfig = {
  id: "default",
  name: "Swiss Modern",
  logo: undefined,
  favicon: undefined,
  displayFont: "Geist",
  bodyFont: "Geist",
};

export { defaultTheme as theme };
