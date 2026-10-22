# Theme Architecture Audit

## Findings and affected code

| Finding | Affected files | Effect |
| --- | --- | --- |
| Admin shell rebound `--color-background`, `--color-surface-elevated`, `--color-surface`, and foreground roles to aliases that referenced those same names. This formed invalid custom-property cycles. | `src/app/globals.css`, `src/features/admin/AdminShell.tsx` | Admin backgrounds and shared utilities could resolve invalid or fall through, making the theme appear incomplete. |
| Many legacy neutral utilities used fixed names such as `bg-white`, gray text, neutral borders, and arbitrary shadow values. | 20 TS/TSX files under `src` | These classes were migrated to semantic surface, text, border, and elevation utilities; the compatibility bridge was removed. Alpha-white controls remain only where they overlay photography. |
| Shared UI used literal surface and shadow styles. | `src/components/ui/Card.tsx`, `src/components/ui/Drawer.tsx`, `src/components/ui/Modal.tsx`, `src/features/admin/AdminTable.tsx`, `src/features/admin/AdminTopBar.tsx` | Reusable cards, overlays, and data surfaces did not consistently express theme roles. |
| Theme restoration ran in a React effect after first paint. | `src/components/dev/ThemeSwitcher.tsx`, `src/app/layout.tsx` | A saved preview theme could flash the default palette before hydration. |
| Styling is split among runtime CSS variables and Tailwind utilities; no separate MUI or Tailwind JS theme config exists. | `src/app/globals.css`, `src/theme/tokens.ts`, `package.json` | `globals.css` must remain authoritative; runtime theme switching relies on root variables. MUI integration is inapplicable because MUI is not installed. |
| The dark profiles' core palette was declared before the legacy per-theme blocks, so later declarations restored light surfaces. Image cards also used a foreground-colored scrim, which becomes a pale gradient in dark themes. | `src/app/globals.css`, `src/features/storefront/CategoryShowcase.tsx`, `src/features/storefront/BrandShowcase.tsx` | The final family layer now follows all legacy palettes; photo-card scrims use fixed black for text contrast. Header, service strip, content surfaces, product cards, footer, and controls resolve to coordinated dark tokens. |
| The theme list identified names but not intensity families; theme selection could not restore the deployment's configured starting point. | `src/theme/index.ts`, `src/components/dev/ThemeSwitcher.tsx`, `src/app/layout.tsx` | Catalog metadata now assigns all 12 identities across five families, shows family labels, and provides a restore-to-deployment action. |

## Coverage map

The root layout applies `globals.css` to all App Router routes. Storefront routes use `StorefrontLayout` and its shared header/footer; protected admin routes use `AdminShell` with shared sidebar/top bar. Reusable form controls, cards, drawers, dialogs, product cards, tables, badges, skeletons, and empty/error states live under `src/components/ui` and `src/features`. Route inventory is under `src/app` (69 `page.tsx`/`loading.tsx` files at audit time); nested account, checkout, product, support, integration, and settings routes inherit one of these shells.

Screen groups covered by the root theme and semantic utility migration:

- Storefront: home/editorial sections, shop/catalog and filtering, category/brand listings, product detail/gallery/variants, cart, checkout, customer authentication, account/profile/addresses/orders/reviews/support, wishlist, policy pages, and order success.
- Admin: login, dashboard, product creation/editing and variants, categories, brands, orders, reviews, support tickets, carousel, promotions, tax, shipping, store policies/SEO/basic settings, and email/SMS/payment/Google integration screens.

Key shared surface migrations: storefront header and admin toolbar use header tokens; admin sidebar uses sidebar token; tables use table token; cards use card radius/elevation; drawers/dialogs use dialog surface and overlay elevation. Input/select backgrounds use the form surface token globally. Legacy exact neutral utility classes across common screens were changed to semantic utilities, and the shim was removed. Informational support states now use dedicated info tokens rather than fixed blue utilities.

## Validation constraints and latest visual review

The skill's bundled searchable database requires Python 3, which is not available; its Quick Reference guidance was applied directly. The application was reachable in the in-app browser. Full-page renders were inspected for Swiss Modern, Obsidian Luxury, Coffeehouse, Midnight Tech, and Graphite Modern. Obsidian Luxury renders near-black/charcoal surfaces; Midnight Tech renders blue-black surfaces with cyan actions; Graphite Modern renders layered slate with a lime accent; Coffeehouse now occupies a warm taupe mid-tone; Swiss Modern remains bright. The full token palette for all 12 IDs was checked in the browser. Product detail and sign-in routes were also inspected under Graphite Modern. Photo cards preserve product/category photography with a dark label scrim. Product images intentionally retain their own photographic backgrounds.

`npx tsc --noEmit --pretty false` passes. `npm run build` compiles the production bundle, then Next.js exits at its TypeScript worker step with `spawn EPERM`. No test script is defined. Separate screenshot files for all twelve profiles and narrow mobile viewport captures were not produced in this pass. `git diff --check` passes. MUI is not installed and no MUI theme/provider is part of the app.
