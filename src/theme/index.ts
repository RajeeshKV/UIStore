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

export type ThemePresentation = {
  header: "swiss" | "atelier" | "centered" | "campaign" | "utility" | "soft" | "outdoor" | "editorial" | "technical" | "pop" | "titanium" | "couture";
  hero: "split" | "cinematic" | "campaign" | "centered" | "editorial" | "gallery" | "technical" | "couture" | "retail" | "soft" | "outdoor";
  categories: "tiles" | "masonry" | "soft-grid" | "geometric" | "compact" | "quiet-grid" | "outdoor-grid" | "editorial" | "technical-grid" | "promo-grid" | "gallery-grid" | "couture-grid";
  featured: "clean" | "spotlight" | "cozy" | "campaign" | "compact" | "soft" | "story" | "editorial" | "dense" | "promotional" | "gallery" | "couture";
  productCards: "minimal" | "luxury" | "warm" | "bold" | "retail" | "soft" | "outdoor" | "editorial" | "technical" | "promo" | "titanium" | "couture";
  footer: "quiet" | "dark" | "warm" | "campaign" | "compact" | "soft" | "earth" | "editorial" | "technical" | "pop" | "titanium" | "couture";
};

export type ThemePalette = {
  background: string; surface: string; surfaceElevated: string; surfaceContainer: string;
  foreground: string; foregroundMuted: string; border: string; primary: string;
  primaryForeground: string; secondary: string; secondaryForeground: string;
  headerBackground: string; sectionBackground: string; sectionAlternate: string;
  productSurface: string; categorySurface: string; controlBackground: string;
  controlBorder: string; muted: string; link: string; focus: string; overlay: string;
  displayFont: string; bodyFont: string; radiusSm: string; radiusMd: string;
  radiusLg: string; radius2xl: string; sectionSpace: string;
};

export type StoreThemeDefinition = {
  id: string; name: string; family: ThemeFamily; swatch: string; description: string;
  logo?: string;
  palette: ThemePalette;
  presentation: ThemePresentation;
};

const sharedPalette: ThemePalette = {
  background: "#f8f9fb", surface: "#f3f4f6", surfaceElevated: "#ffffff", surfaceContainer: "#edeef0",
  foreground: "#191c1e", foregroundMuted: "#444748", border: "#c4c7c7", primary: "#000000",
  primaryForeground: "#ffffff", secondary: "#ba0918", secondaryForeground: "#ffffff",
  headerBackground: "#ffffff", sectionBackground: "#f3f4f6", sectionAlternate: "#edeef0",
  productSurface: "#ffffff", categorySurface: "#edeef0", controlBackground: "#ffffff",
  controlBorder: "#c4c7c7", muted: "#edeef0", link: "#000000", focus: "#000000",
  overlay: "rgb(0 0 0 / 50%)", displayFont: '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif',
  bodyFont: '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif', radiusSm: ".5rem",
  radiusMd: ".75rem", radiusLg: "1rem", radius2xl: "1.875rem", sectionSpace: "2.5rem",
};

const palette = (values: Partial<ThemePalette> = {}): ThemePalette => ({ ...sharedPalette, ...values });

/** One customer-ready record owns its visual tokens, brand mark, and layout recipe. */
export const themeCatalog = [
  { id: "default", name: "Swiss Modern", family: "bright-light", swatch: "#171a1d", description: "Architectural white, precise grid, clean product-first hierarchy.", palette: palette(), presentation: { header: "swiss", hero: "split", categories: "tiles", featured: "clean", productCards: "minimal", footer: "quiet" } },
  { id: "luxe", name: "Obsidian Atelier", family: "dark", swatch: "#c7a46b", description: "Cinematic black, warm ivory type, quiet luxury merchandising.", palette: palette({ background: "#12110f", surface: "#1b1916", surfaceElevated: "#24211d", surfaceContainer: "#2d2923", foreground: "#f4eee4", foregroundMuted: "#c0b6a7", border: "#52483b", primary: "#c7a46b", primaryForeground: "#1b150b", secondary: "#b68d51", secondaryForeground: "#1b150b", headerBackground: "#171512", sectionBackground: "#1b1916", sectionAlternate: "#24211d", productSurface: "#1b1916", categorySurface: "#2d2923", controlBackground: "#1b1916", controlBorder: "#52483b", muted: "#2d2923", link: "#e0bd76", focus: "#e0bd76", overlay: "rgb(0 0 0 / 76%)", displayFont: 'Georgia, "Times New Roman", serif', radiusSm: ".25rem", radiusMd: ".375rem", radiusLg: ".625rem", radius2xl: "1.125rem", sectionSpace: "3rem" }), presentation: { header: "atelier", hero: "cinematic", categories: "masonry", featured: "spotlight", productCards: "luxury", footer: "dark" } },
  { id: "starbucks", name: "Warm Minimalist Luxury", family: "mid-tone", swatch: "#006241", description: "Stone, espresso and soft serif typography with tactile restraint.", palette: palette({ background: "#c8beae", surface: "#d5cbbb", surfaceElevated: "#e3dacb", surfaceContainer: "#b9ad9b", foreground: "#29251f", foregroundMuted: "#50483e", border: "#9e927f", primary: "#006241", primaryForeground: "#ffffff", secondary: "#a8753e", secondaryForeground: "#ffffff", headerBackground: "#ded4c4", sectionBackground: "#c8beae", sectionAlternate: "#b9ad9b", productSurface: "#e3dacb", categorySurface: "#b9ad9b", controlBackground: "#e3dacb", controlBorder: "#9e927f", muted: "#b9ad9b", link: "#005536", focus: "#006241", overlay: "rgb(31 26 20 / 54%)", displayFont: 'Georgia, "Times New Roman", serif', radiusSm: ".5rem", radiusMd: ".75rem", radiusLg: "1rem", radius2xl: "1.5rem", sectionSpace: "2.75rem" }), presentation: { header: "centered", hero: "centered", categories: "soft-grid", featured: "cozy", productCards: "warm", footer: "warm" } },
  { id: "levis", name: "Bold Contemporary", family: "bright-light", swatch: "#17365d", description: "Strong ink typography, angular campaign panels and confident CTAs.", palette: palette({ background: "#f1ede4", surface: "#f8f5ef", surfaceElevated: "#fffefa", surfaceContainer: "#e7e0d4", foreground: "#202a35", foregroundMuted: "#626c76", border: "#d5d8d8", primary: "#17365d", primaryForeground: "#ffffff", secondary: "#c41230", secondaryForeground: "#ffffff", headerBackground: "#fffefa", sectionBackground: "#f8f5ef", sectionAlternate: "#e7e0d4", productSurface: "#fffefa", categorySurface: "#e7e0d4", controlBackground: "#fffefa", controlBorder: "#d5d8d8", muted: "#e7e0d4", link: "#17365d", focus: "#c41230", displayFont: "Arial, Helvetica, sans-serif", radiusSm: ".125rem", radiusMd: ".25rem", radiusLg: ".375rem", radius2xl: ".75rem" }), presentation: { header: "campaign", hero: "campaign", categories: "geometric", featured: "campaign", productCards: "bold", footer: "campaign" } },
  { id: "ikea", name: "Vibrant Retail", family: "bright-light", swatch: "#0058a3", description: "A compact, high-energy catalog with a clear promotional rhythm.", palette: palette({ background: "#eef2f7", surface: "#f5f7fa", surfaceElevated: "#ffffff", surfaceContainer: "#e0e7f0", foreground: "#102b54", foregroundMuted: "#4f6179", border: "#cbd5e2", primary: "#0058a3", primaryForeground: "#ffffff", secondary: "#ffda1a", secondaryForeground: "#102b54", headerBackground: "#ffffff", sectionBackground: "#f5f7fa", sectionAlternate: "#e0e7f0", productSurface: "#ffffff", categorySurface: "#e0e7f0", controlBackground: "#ffffff", controlBorder: "#cbd5e2", muted: "#e0e7f0", link: "#0058a3", focus: "#0058a3", displayFont: "Arial, Helvetica, sans-serif", radiusSm: ".25rem", radiusMd: ".375rem", radiusLg: ".5rem", radius2xl: "1rem" }), presentation: { header: "utility", hero: "split", categories: "compact", featured: "compact", productCards: "retail", footer: "compact" } },
  { id: "sephora", name: "Soft Premium", family: "mild-light", swatch: "#b77b83", description: "Porcelain surfaces, gentle rose accents, calm beauty-editorial pacing.", palette: palette({ background: "#f4f2f0", surface: "#faf9f8", surfaceElevated: "#ffffff", surfaceContainer: "#e9e5e2", foreground: "#171515", foregroundMuted: "#6e6564", border: "#d9d2ce", primary: "#171515", primaryForeground: "#ffffff", secondary: "#b77b83", secondaryForeground: "#ffffff", headerBackground: "#ffffff", sectionBackground: "#faf9f8", sectionAlternate: "#e9e5e2", productSurface: "#ffffff", categorySurface: "#e9e5e2", controlBackground: "#ffffff", controlBorder: "#d9d2ce", muted: "#e9e5e2", link: "#171515", focus: "#9b626b", radiusSm: ".5rem", radiusMd: ".75rem", radiusLg: "1rem", radius2xl: "2rem", sectionSpace: "2.625rem" }), presentation: { header: "soft", hero: "split", categories: "soft-grid", featured: "soft", productCards: "soft", footer: "soft" } },
  { id: "patagonia", name: "Earthy Organic", family: "mid-tone", swatch: "#234c3b", description: "Forest green, trail clay and an image-led outdoor collection grid.", palette: palette({ background: "#aeb9aa", surface: "#bfc9bb", surfaceElevated: "#d1dbcd", surfaceContainer: "#9eab9b", foreground: "#202b25", foregroundMuted: "#435047", border: "#859384", primary: "#234c3b", primaryForeground: "#ffffff", secondary: "#a43a3d", secondaryForeground: "#ffffff", headerBackground: "#c5d0c1", sectionBackground: "#aeb9aa", sectionAlternate: "#9eab9b", productSurface: "#d1dbcd", categorySurface: "#9eab9b", controlBackground: "#d1dbcd", controlBorder: "#859384", muted: "#9eab9b", link: "#193f30", focus: "#234c3b", overlay: "rgb(20 30 24 / 55%)", displayFont: 'Georgia, "Times New Roman", serif', radiusSm: ".5rem", radiusMd: ".75rem", radiusLg: "1rem", radius2xl: "1.5rem", sectionSpace: "2.75rem" }), presentation: { header: "outdoor", hero: "outdoor", categories: "outdoor-grid", featured: "story", productCards: "outdoor", footer: "earth" } },
  { id: "tiffany", name: "Neo-Editorial", family: "mild-light", swatch: "#0f6f68", description: "Magazine-scale typography, asymmetric imagery and quiet product notes.", palette: palette({ background: "#f5f1eb", surface: "#fbf9f6", surfaceElevated: "#ffffff", surfaceContainer: "#e9e3da", foreground: "#243b3b", foregroundMuted: "#687b78", border: "#d7e2de", primary: "#0f6f68", primaryForeground: "#ffffff", secondary: "#81d8d0", secondaryForeground: "#183d3a", headerBackground: "#ffffff", sectionBackground: "#fbf9f6", sectionAlternate: "#e9e3da", productSurface: "#ffffff", categorySurface: "#e9e3da", controlBackground: "#ffffff", controlBorder: "#d7e2de", muted: "#e9e3da", link: "#0f6f68", focus: "#0f6f68", radiusSm: ".5rem", radiusMd: ".75rem", radiusLg: "1rem", radius2xl: "2rem", sectionSpace: "2.625rem" }), presentation: { header: "editorial", hero: "editorial", categories: "editorial", featured: "editorial", productCards: "editorial", footer: "editorial" } },
  { id: "adidas", name: "Graphite Modern", family: "mild-dark", swatch: "#d4ff36", description: "Dense graphite utility with sharp technical controls and fast browsing.", palette: palette({ background: "#202326", surface: "#292d30", surfaceElevated: "#33383b", surfaceContainer: "#3b4144", foreground: "#f1f3f3", foregroundMuted: "#c3c9ca", border: "#555e61", primary: "#f1f3f3", primaryForeground: "#202326", secondary: "#d4ff36", secondaryForeground: "#202326", headerBackground: "#25292c", sectionBackground: "#292d30", sectionAlternate: "#33383b", productSurface: "#292d30", categorySurface: "#33383b", controlBackground: "#292d30", controlBorder: "#555e61", muted: "#3b4144", link: "#e2ff8a", focus: "#d4ff36", overlay: "rgb(0 0 0 / 72%)", displayFont: "Arial, Helvetica, sans-serif", radiusSm: ".125rem", radiusMd: ".25rem", radiusLg: ".375rem", radius2xl: ".75rem", sectionSpace: "1.875rem" }), presentation: { header: "technical", hero: "technical", categories: "technical-grid", featured: "dense", productCards: "technical", footer: "technical" } },
  { id: "coca-cola", name: "Pop Retail", family: "bright-light", swatch: "#e8002d", description: "Red campaign hits, compact offers and punchy product pricing.", palette: palette({ background: "#f9efed", surface: "#fff8f7", surfaceElevated: "#ffffff", surfaceContainer: "#f0dedb", foreground: "#311b1b", foregroundMuted: "#765d5c", border: "#e5cfcc", primary: "#e41e2b", primaryForeground: "#ffffff", secondary: "#311b1b", secondaryForeground: "#ffffff", headerBackground: "#fffdfc", sectionBackground: "#fff8f7", sectionAlternate: "#f0dedb", productSurface: "#ffffff", categorySurface: "#f0dedb", controlBackground: "#ffffff", controlBorder: "#e5cfcc", muted: "#f0dedb", link: "#e41e2b", focus: "#c91b27", radiusSm: ".375rem", radiusMd: ".5rem", radiusLg: ".75rem", radius2xl: "1.5rem" }), presentation: { header: "pop", hero: "campaign", categories: "promo-grid", featured: "promotional", productCards: "promo", footer: "pop" } },
  { id: "amazon", name: "Midnight Titanium", family: "dark", swatch: "#55d6ff", description: "Midnight blue, titanium surfaces and crisp technical product hierarchy.", palette: palette({ background: "#0b1220", surface: "#101b2d", surfaceElevated: "#17263b", surfaceContainer: "#1c304a", foreground: "#e7f0ff", foregroundMuted: "#afc2dc", border: "#35506f", primary: "#55d6ff", primaryForeground: "#05131c", secondary: "#9ab4ff", secondaryForeground: "#0b1220", headerBackground: "#101b2d", sectionBackground: "#101b2d", sectionAlternate: "#0e192a", productSurface: "#101b2d", categorySurface: "#17263b", controlBackground: "#101b2d", controlBorder: "#35506f", muted: "#1c304a", link: "#75e2ff", focus: "#75e2ff", overlay: "rgb(1 7 16 / 80%)", displayFont: "Inter, ui-sans-serif, system-ui, sans-serif", bodyFont: "Inter, ui-sans-serif, system-ui, sans-serif", radiusSm: ".25rem", radiusMd: ".375rem", radiusLg: ".5rem", radius2xl: "1rem", sectionSpace: "2rem" }), presentation: { header: "titanium", hero: "gallery", categories: "gallery-grid", featured: "gallery", productCards: "titanium", footer: "titanium" } },
  { id: "dior", name: "Couture Editorial", family: "mild-light", swatch: "#b49a70", description: "High-fashion art direction, image-led campaigns and couture spacing.", palette: palette({ background: "#f5f0e8", surface: "#fcfaf7", surfaceElevated: "#ffffff", surfaceContainer: "#e9e0d4", foreground: "#211d1a", foregroundMuted: "#756b61", border: "#ded4c8", primary: "#211d1a", primaryForeground: "#ffffff", secondary: "#b49a70", secondaryForeground: "#211d1a", headerBackground: "#fffdf9", sectionBackground: "#fcfaf7", sectionAlternate: "#e9e0d4", productSurface: "#ffffff", categorySurface: "#e9e0d4", controlBackground: "#ffffff", controlBorder: "#ded4c8", muted: "#e9e0d4", link: "#211d1a", focus: "#8e744d", overlay: "rgb(0 0 0 / 50%)", displayFont: 'Georgia, "Times New Roman", serif', radiusSm: ".25rem", radiusMd: ".375rem", radiusLg: ".625rem", radius2xl: "1.125rem", sectionSpace: "2.625rem" }), presentation: { header: "couture", hero: "couture", categories: "couture-grid", featured: "couture", productCards: "couture", footer: "couture" } },
] as const satisfies readonly StoreThemeDefinition[];

export type ThemeId = (typeof themeCatalog)[number]["id"];

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === "string" && themeCatalog.some((theme) => theme.id === value);
}

export function getThemeConfig(id: ThemeId): StoreThemeDefinition {
  return themeCatalog.find((item) => item.id === id) ?? themeCatalog[0];
}

export function getThemeCssVariables(id: ThemeId): Record<string, string> {
  const { palette: p } = getThemeConfig(id);
  // Carry the brand hue into supporting surfaces so a theme reads as a brand
  // across the storefront, rather than as white cards with a colored CTA.
  const tintColor = id === "default" ? null : isNearNeutral(p.primary) ? p.secondary : p.primary;
  const tint = (color: string, amount: number) => tintColor ? mixHex(color, tintColor, amount) : color;
  return {
    "--color-background": tint(p.background, 0.035),
    "--color-storefront-background": tint(p.background, 0.035),
    "--color-admin-canvas": p.background,
    "--color-surface": tint(p.surface, 0.07),
    "--color-surface-elevated": tint(p.surfaceElevated, 0.12),
    "--color-surface-container": tint(p.surfaceContainer, 0.09),
    "--color-foreground": p.foreground,
    "--color-foreground-muted": p.foregroundMuted,
    "--color-muted-foreground": p.foregroundMuted,
    "--color-border": p.border,
    "--color-border-strong": p.border,
    "--color-control-border": p.controlBorder,
    "--color-primary": p.primary,
    "--color-primary-foreground": p.primaryForeground,
    "--color-secondary": p.secondary,
    "--color-secondary-foreground": p.secondaryForeground,
    "--color-accent": p.primary,
    "--color-accent-foreground": p.primaryForeground,
    "--color-muted": p.muted,
    "--color-header-background": tint(p.headerBackground, 0.08),
    "--color-section-background": tint(p.sectionBackground, 0.08),
    "--color-section-alternate": tint(p.sectionAlternate, 0.12),
    "--color-product-surface": tint(p.productSurface, 0.09),
    "--color-category-surface": tint(p.categorySurface, 0.12),
    "--color-control-background": tint(p.controlBackground, 0.08),
    "--color-form-surface": tint(p.controlBackground, 0.08),
    "--color-table-surface": tint(p.surfaceElevated, 0.12),
    "--color-popover-surface": tint(p.surfaceElevated, 0.12),
    "--color-dialog-surface": tint(p.surfaceElevated, 0.12),
    "--color-link": p.link,
    "--color-focus": p.focus,
    "--color-focus-ring": `color-mix(in srgb, ${p.focus} 22%, transparent)`,
    "--color-overlay": p.overlay,
    "--font-display": p.displayFont,
    "--font-sans": p.bodyFont,
    "--radius-sm": p.radiusSm,
    "--radius-md": p.radiusMd,
    "--radius-lg": p.radiusLg,
    "--radius-2xl": p.radius2xl,
    "--radius-theme-card": p.radiusMd,
    "--radius-theme-button": p.radiusSm,
    "--theme-section-space": p.sectionSpace,
  };
}

function isNearNeutral(hex: string): boolean {
  const channels = parseHex(hex);
  if (!channels) return true;
  const spread = Math.max(...channels) - Math.min(...channels);
  return spread < 34;
}

function mixHex(base: string, accent: string, amount: number): string {
  const baseRgb = parseHex(base);
  const accentRgb = parseHex(accent);
  if (!baseRgb || !accentRgb) return base;
  const result = baseRgb.map((channel, index) => Math.round(channel * (1 - amount) + accentRgb[index] * amount));
  return `#${result.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

function parseHex(hex: string): [number, number, number] | null {
  const match = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex);
  return match ? [parseInt(match[1], 16), parseInt(match[2], 16), parseInt(match[3], 16)] : null;
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
