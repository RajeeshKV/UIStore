---
name: Shopey Luxury Tech
colors:
  surface: '#f8f9fb'
  surface-dim: '#d9dadc'
  surface-bright: '#f8f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f6'
  surface-container: '#edeef0'
  surface-container-high: '#e7e8ea'
  surface-container-highest: '#e1e2e4'
  on-surface: '#191c1e'
  on-surface-variant: '#444748'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f3'
  outline: '#747878'
  outline-variant: '#c4c7c7'
  surface-tint: '#5f5e5e'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1c1b1b'
  on-primary-container: '#858383'
  inverse-primary: '#c9c6c5'
  secondary: '#ba0918'
  on-secondary: '#ffffff'
  secondary-container: '#de2d2d'
  on-secondary-container: '#fffbff'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#111c2c'
  on-tertiary-container: '#798498'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e5e2e1'
  primary-fixed-dim: '#c9c6c5'
  on-primary-fixed: '#1c1b1b'
  on-primary-fixed-variant: '#474646'
  secondary-fixed: '#ffdad6'
  secondary-fixed-dim: '#ffb4ac'
  on-secondary-fixed: '#410003'
  on-secondary-fixed-variant: '#93000e'
  tertiary-fixed: '#d8e3f9'
  tertiary-fixed-dim: '#bcc7dd'
  on-tertiary-fixed: '#111c2c'
  on-tertiary-fixed-variant: '#3c4759'
  background: '#f8f9fb'
  on-background: '#191c1e'
  surface-variant: '#e1e2e4'
typography:
  display-hero:
    fontFamily: Plus Jakarta Sans
    fontSize: 56px
    fontWeight: '800'
    lineHeight: 64px
  display-hero-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 34px
    fontWeight: '800'
    lineHeight: 42px
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 34px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 28px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  price-hero:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '800'
    lineHeight: 28px
  price-original:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
  caption-caps:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  margin: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system embodies modern luxury technology retail: polished, restrained, hyper-legible, and confidently minimal. The aesthetic speaks to discerning consumers seeking state-of-the-art consumer hardware, studio audio gear, smart living devices, and premium optics. 

The design combines high-end minimalism with tactile e-commerce precision:
- **Pristine Canvas**: Generous breathable whitespace paired with soft warm-tinted and neutral slate surfaces allows the product photography to feel museum-grade.
- **Architectural Typography**: Clean, geometric grotesk letterforms create instant authority across hero banners, pricing locks, and categorical indices.
- **Micro-Tactility**: Crisp borders, fluid carousel touchpoints, pill navigation indicators, and deep obsidian CTA elements that ground the user in high-confidence transactions.
- **Subdued Luxury Accents**: Subtle red discount indicators balance crisp monochromatic structure, retaining commercial urgency without compromising prestige.

## Colors

The palette is engineered around high-contrast monochrome tones with calculated accents:
- **Primary (`#0D0D0D`)**: Deep obsidian black used for branding, primary action triggers, bold product titles, and solid iconography.
- **Secondary (`#E02E2E`)**: Vivid crimson red reserved strictly for promotional badges, markdown stickers (e.g. `-100%`, `-25%`), and active state alerts.
- **Tertiary (`#5A6578`)**: Balanced slate gray for secondary metadata, product SKU details, struck-through original pricing, breadcrumbs, and inactive nav states.
- **Neutral (`#F4F5F7`)**: Pristine cool-slate surface fill for input search fields, badge containers, subtle card backings, and feature strips.
- **Surface & Borders**: Pure white (`#FFFFFF`) forms the foundational card and canvas background, bound by gossamer structural borders (`#E5E7EB` to `#EDEDED`).

## Typography

Typographic scale is structured around `Plus Jakarta Sans` to evoke technical clarity and sophisticated consumer luxury:
- **Hierarchy & Tracking**: Main marketing headlines employ `-0.02em` tracking for a tight, high-end editorial presence. Category headers (`headline-lg`) command clear vertical rhythm.
- **Price Architecture**: Active prices are styled in bold, high-density weights (`800`) paired immediately beside struck-out original values in `tertiary` tone with `line-through` formatting.
- **Uppercase Overlines**: Promotional accents like "NEW ARRIVALS" and "FILTERS" use `caption-caps` with wide tracking (`+0.08em`) to demarcate sections without visual noise.

## Layout & Spacing

The layout operates on a standard 12-column fluid grid system bounded by a desktop maximum width of `1440px`:
- **Desktop Grid (≥1024px)**: 12 columns with `1.5rem` (24px) gutters and `2rem` (32px) page boundaries. Product listings default to a 4-column arrangement in full catalog mode and a 3-column arrangement when the left filter sidebar is pinned.
- **Tablet Grid (768px - 1023px)**: 8 columns with `1rem` gutters; sidebar shifts into a sliding modal panel or accordion sheet. Product items collapse to 2 columns.
- **Mobile Grid (<768px)**: 4 columns with `1rem` edge margins and `0.75rem` gutters. Product cards display in a 2-column compact grid or 1-column featured feed.
- **Section Rhythm**: A unified `2.5rem` (`space-xl`) to `4rem` separation ensures adequate pacing between banner heroes, promotional feature bands, category carousels, and footer sections.

## Elevation & Depth

This design system prioritizes a refined flat-plus-surface aesthetic using structural lines and whisper-thin ambient shadows:
- **Card Tiering**: Product cards utilize a flat pure white background enveloped in a subtle border (`1px solid #E5E7EB`). In default state, they maintain `0px` vertical shadow for a clean gallery feel.
- **Hover Elevation**: On pointer hover, product cards apply an ultra-soft atmospheric shadow: `0 8px 24px -4px rgba(0, 0, 0, 0.06)`, slightly elevating off the canvas.
- **Floating Controls**: Carousel navigators (round circular next/previous arrows) and wishlist toggles leverage `0 2px 8px rgba(0, 0, 0, 0.08)` to float distinctively above photographic assets.
- **Feature Bar**: Trust badges and store highlights (Free Shipping, Secure Payments) sit within a cohesive tinted panel (`#F8F9FA` or bordered `#EDEDED`) without drop shadows.

## Shapes

The interface balances sharp precision with modern gentle radii:
- **Base Surfaces & Cards**: `rounded-lg` (0.75rem to 1rem / 12px-16px) creates a polished, friendly enclosure for product photography and category pods.
- **Primary Buttons & Field Inputs**: `0.5rem` (8px) to `0.75rem` (12px) curvature maintains firm architectural footing while avoiding harsh brutalist points.
- **Icon Circles & Interactive Badges**: Pill-shaped and full-circular radii (`rounded-full`) are reserved for directional carousel pills, category navigation circles, wishlist hearts, color swatch selectors, and top-level cart count chips.

## Components

### Buttons
- **Primary Cart Action**: Full-width or inline dark obsidian (`#0D0D0D`) buttons featuring white text (`#FFFFFF`) with inline cart iconography. Subtle hover transition shifts to `#262626`.
- **Icon Actions**: Circular white discs (`40px × 40px`) with `1px solid #E5E7EB` housing centered monochrome stroke icons (e.g. forward arrows, wishlist hearts). Hover states invert or darken borders.
- **Secondary / Ghost**: White background with a clean `1px solid #D1D5DB` border and dark typography for secondary actions like "View All".

### Cards & Catalogs
- **Product Card**: Features an upper media container (light studio imagery or transparent PNG cutout), high-contrast top-left discount tag (`#E02E2E`), and top-right wishlist toggle. Beneath the imagery: clear title truncated to 2 lines, bold current price, crossed-out original price, color selection swatches (e.g., Space Black, Natural Titanium), and a solid "Add to Cart" button.
- **Category Card**: Rounded rectangular banner housing scenic hardware setups with an overlay gradient or clean bottom scrim, category title, live inventory count, and a bottom-right circular forward link.

### Inputs & Search
- **Header Global Search**: Elongated rounded capsule or soft-corner rectangle filled with `#F4F5F7` and no border in resting state. Contains a magnifying glass icon, placeholder in `#5A6578`, and focus ring (`1px solid #0D0D0D`).
- **Newsletter Subscription**: Horizontal compound control pairing a borderless white input field within a rounded enclosure with an attached solid black "Subscribe" button.

### Badges & Chips
- **Discount Badges**: Squircle-style crimson pills (`#E02E2E`) with crisp white uppercase micro-type (e.g., `-25%`).
- **Cart Count Indicator**: Circular pill anchored to the cart icon in dark charcoal or black with crisp white micro-type.

### Selection Controls & Checkboxes
- **Facet Checkboxes**: Rounded squares (`18px × 18px`) with `1.5px solid #D1D5DB` borders. Checked state fills with `#0D0D0D` accompanied by a white checkmark.
- **Color Swatches**: Concentric nested circles; active swatch includes a `2px` offset white ring bound by a thin charcoal stroke.