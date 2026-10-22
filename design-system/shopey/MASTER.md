# Shopey Global Theme System

`src/theme/index.ts` is the source of truth for customer brand palettes and theme recipes. `src/app/globals.css` defines the semantic fallback tokens and composition rules. `src/theme/tokens.ts` mirrors semantic token names for TypeScript consumers. Tailwind v4 utilities resolve through variables registered in the `@theme` block. The root uses `data-theme` for theme identity and `data-theme-*` attributes for composition profiles.


## Product direction

Shopey is a responsive commerce storefront paired with an operational admin workspace. Keep product imagery and business data intact while giving the surrounding environment a clear visual identity. Each storefront recipe must change composition and hierarchy as well as color. Admin hierarchy stays compact, readable, and task focused. Body text and controls need strong contrast, clear borders, visible focus, and a reduced-motion path.

## Theme identities

Theme IDs are stable deployment keys. `src/theme/index.ts` is the customer-ready registry: each `StoreThemeDefinition` contains brand tokens, optional logo, and independent shared-component layout recipes. Supporting surfaces derive subtle tints from the configured brand color, so theme color carries through the canvas, header, cards, and controls. `SHOPEY_STORE_THEME` chooses the deployment theme; uploaded business settings logo takes precedence over the optional theme logo. Development preview selection is temporary. The registry's palette supplies CSS variables while `data-theme-*` attributes select header, hero, category, featured, product-card, and footer compositions.

| ID | Visual identity |
| --- | --- |
| `default` | Swiss Modern · bright-light: cool porcelain canvas, ink actions, restrained crimson, precise grid. |
| `luxe` | Obsidian Atelier · dark: cinematic image-led hero, charcoal layers, ivory text, champagne actions, serif display. |
| `starbucks` | Warm Minimalist Luxury: oat stone surfaces, centered layout, evergreen accents, soft serif hierarchy. |
| `levis` | Denim heritage: warm canvas, indigo actions, heritage red, squared compact controls. |
| `ikea` | Vibrant Retail: blue campaign hero, yellow offer actions, compact five-column retail rhythm. |
| `sephora` | Soft Premium: porcelain surfaces, rose accents, soft-grid cards, rounded quiet presentation. |
| `patagonia` | Earthy Organic: muted earth canvas, forest actions, trail red, outdoor collection grid. |
| `tiffany` | Neo-Editorial: magazine-scale hero, asymmetric collections, editorial product and footer layouts. |
| `adidas` | Graphite Modern · mild-dark: layered graphite surfaces, angular compact shapes, electric lime accent. |
| `coca-cola` | Beverage retail: warm blush paper, cola ink, confident red accents, rounded forms. |
| `amazon` | Midnight Titanium · dark: blue-black gallery hero, technical collections, cyan actions and crisp borders. |
| `dior` | Couture Editorial: centered high-fashion campaign, asymmetric collections, cream canvas and muted gold. |

## Customer onboarding

To propose a new customer direction, gather the logo, brand colors, preferred font assets/families, product categories, and 2–3 reference storefronts. Add one registry entry by composing an existing presentation recipe or adding a new profile in `src/app/globals.css` when the desired structure is genuinely different. Keep commerce behavior in shared components. Preview using the development theme switcher, then set the new stable ID in the customer's deployment environment. Palette changes should not require editing page components; new structural behavior should be implemented as a reusable presentation profile.


## Token roles

Use semantic roles rather than theme-specific hex values in components: app/storefront/admin canvas; header/sidebar/section surfaces; primary, secondary, tertiary, elevated, product, category, table, form, popover, dialog and tooltip surfaces; primary/secondary/muted/inverse text; brand, button, link, focus and selected states; subtle/default/strong/input/table/navigation borders; card/hover/overlay elevations; radii; and success/warning/error/information foreground, surface, and color roles.

The storefront and admin use the same active theme by design. Admin shell background uses its own role without rebinding shared tokens. If independent storefront/admin preferences are added later, scope separate root theme attributes while retaining this semantic contract.

## Component rules

- Prefer semantic Tailwind utilities such as `bg-background`, `bg-surface-elevated`, `bg-header-background`, `bg-table-surface`, `bg-form-surface`, `text-foreground`, `border-border`, and `shadow-card`.
- Use fixed white/black only for photographic overlays, product imagery, toggle knobs, or text on a deliberately branded surface.
- Use status roles for success, warning, error, and information. Do not recolor business data or brand assets.
- Do not add a second palette in component code. Keep fixed utility values only when they represent content or interaction semantics.
- The project uses Tailwind CSS v4 and no Material UI package/provider. A separate MUI theme is not maintained.

## Accessibility and responsive behavior

Keep normal text contrast at or above 4.5:1, preserve visible focus and semantic labels, do not rely on color alone, and honor `prefers-reduced-motion`. Use responsive layout utilities and avoid hiding content behind fixed navigation. Check narrow (375 px), tablet, and desktop widths when browser preview is available.

## Theme lifecycle

The preview switcher retains the `kromic_dev_theme` localStorage key and `data-theme` root attribute. It is rendered only in development when `NEXT_PUBLIC_THEME_SWITCHER=true`; saved preview state is never used for production. Production receives one server-configured theme through `SHOPEY_STORE_THEME`, with an unset or invalid value falling back to `default`. Preview can restore the deployment theme without affecting customer configuration.

## Intensity families

The registry assigns each of the twelve identities to one family: dark (`luxe`, `amazon`), mild-dark (`adidas`), mid-tone (`starbucks`, `patagonia`), mild-light (`sephora`, `tiffany`, `dior`), and bright-light (`default`, `levis`, `ikea`, `coca-cola`). Family labels are catalog metadata; actual rendered colors, surfaces, shape, and typography stay in the global token layer.
