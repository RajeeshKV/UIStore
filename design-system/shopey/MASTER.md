# Shopey Global Theme System

`src/app/globals.css` is the source of truth for presentation tokens. `src/theme/tokens.ts` mirrors the semantic token names for TypeScript consumers. Tailwind v4 utilities resolve through the variables registered in the `@theme` block. The active preview theme is the root `data-theme` attribute.


## Product direction

Shopey is a responsive commerce storefront paired with an operational admin workspace. Keep product imagery and business data intact while giving the surrounding environment a clear visual identity. Storefront hierarchy should be editorial and product led; admin hierarchy should be compact, readable, and task focused. Body text and controls need strong contrast, clear borders, visible focus, and a reduced-motion path.

## Theme identities

Theme names and IDs are preserved. Each selector owns its canvas, layered surfaces, text, borders, brand/action palette, status colors, shadow character, and shape conventions in `globals.css`.

| ID | Visual identity |
| --- | --- |
| `default` | Swiss Modern · bright-light: cool porcelain canvas, ink actions, restrained crimson, precise grid. |
| `luxe` | Obsidian Luxury · dark: charcoal layered surfaces, ivory text, champagne actions, serif display. |
| `starbucks` | Coffeehouse: oat paper, evergreen actions, latte secondary accent, calm natural elevation. |
| `levis` | Denim heritage: warm canvas, indigo actions, heritage red, squared compact controls. |
| `ikea` | Bright catalog: cool blue-gray canvas, strong blue actions, yellow highlight, crisp utility surfaces. |
| `sephora` | Beauty editorial: soft porcelain, ink controls, rose accent, rounded polished cards. |
| `patagonia` | Outdoor utility: muted earth canvas, forest actions, trail red, grounded borders and shadows. |
| `tiffany` | Jewelry presentation: ivory surfaces, deep teal actions, pale aqua accent, delicate elevation. |
| `adidas` | Graphite Modern · mild-dark: layered graphite surfaces, angular compact shapes, electric lime accent. |
| `coca-cola` | Beverage retail: warm blush paper, cola ink, confident red accents, rounded forms. |
| `amazon` | Midnight Tech · dark: blue-black layered surfaces, cool cyan actions, technical sans and crisp borders. |
| `dior` | Couture editorial: cream canvas, deep ink, muted gold accents, serif headlines and quiet elevation. |


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
