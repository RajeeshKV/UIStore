# Kromic Store — Frontend

Premium e-commerce storefront built with Next.js 16, TypeScript, Tailwind CSS 4, and Motion.

---

## Getting Started

### Prerequisites

- Node.js 20.9+ (required by Next.js 16)
- npm 10+

### Install dependencies

```bash
npm install
```

### Environment setup

```bash
cp .env.example .env.local
```

Edit `.env.local` and set:

```
NEXT_PUBLIC_API_URL=http://localhost:5000   # Kromic Commerce API
NEXT_PUBLIC_APP_URL=http://localhost:3000   # This frontend
```

### Development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production build

```bash
npm run build
npm start
```

### Type checking

```bash
npx tsc --noEmit
```

### Lint

```bash
npx eslint src/
```

---

## Project Structure

```
src/
├── app/                  # Next.js App Router pages and layouts
│   ├── (storefront)/     # Storefront route group
│   ├── (admin)/          # Admin route group
│   ├── (auth)/           # Auth route group
│   ├── layout.tsx        # Root layout — fetches store settings server-side
│   ├── page.tsx          # Home page (Phase 2 will fill this)
│   ├── error.tsx         # Global error boundary
│   ├── not-found.tsx     # 404 page
│   └── globals.css       # Theme tokens, Tailwind 4 config, base styles
│
├── components/
│   ├── ui/               # Reusable primitives
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Badge.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── Drawer.tsx
│   │   ├── Toast.tsx
│   │   ├── Skeleton.tsx  # + ProductCardSkeleton, ProductGridSkeleton, etc.
│   │   ├── EmptyState.tsx
│   │   ├── ErrorState.tsx
│   │   └── Pagination.tsx
│   └── layout/
│       ├── Header.tsx    # Sticky header, mobile nav, search
│       ├── Footer.tsx    # Dynamic settings-driven footer
│       └── StorefrontLayout.tsx
│
├── features/
│   ├── store/            # StoreContext — provides settings to entire app
│   ├── auth/             # (Phase 5)
│   ├── catalog/          # (Phase 3)
│   ├── cart/             # (Phase 5)
│   ├── checkout/         # (Phase 6)
│   ├── orders/           # (Phase 7)
│   ├── profile/          # (Phase 7)
│   └── admin/            # (Phase 8)
│
├── services/api/
│   ├── client.ts         # Core fetch client: auth, refresh, error handling
│   ├── store.ts          # Store settings, categories, brands, products
│   ├── auth.ts           # Register, login, logout, me
│   └── cart.ts           # Cart CRUD
│
├── hooks/                # Reusable React hooks (Phase 3+)
├── stores/               # Global client state (Phase 3+)
├── types/
│   └── api.ts            # TypeScript types mirroring backend API schemas
├── lib/
│   ├── utils.ts          # cn(), formatPrice(), discountPercent()
│   └── motion.ts         # Centralized Motion/Framer variants
├── config/
│   └── env.ts            # Environment variable access with validation
└── theme/
    ├── index.ts          # Theme catalog and customer theme config
    ├── server.ts         # Server-only deployment theme selection
    └── tokens.ts         # Semantic color token names
```

---

## Theme System

All customer branding is driven by semantic CSS custom properties in `src/app/globals.css`.

**Customer deployment:** set the server-only `SHOPEY_STORE_THEME` environment variable to one catalog ID in `src/theme/index.ts`. The root server layout applies that fixed theme to every shopper request for the deployment; unset or invalid values fall back to `default`. This is deployment-level configuration and does not add a field to the store API contract. Add customer logo and font metadata in `src/theme/index.ts` as needed.

**Theme preview:** the floating selector is available only in development when `NEXT_PUBLIC_THEME_SWITCHER=true`. Its local browser preference is a preview convenience and is never used to configure production storefronts.

The 12 catalog identities span five families: dark — Obsidian Luxury (`luxe`) and Midnight Tech (`amazon`); mild-dark — Graphite Modern (`adidas`); mid-tone — Coffeehouse (`starbucks`) and Earthy Organic (`patagonia`); mild-light — Soft Premium (`sephora`), Editorial Minimal (`tiffany`), and Couture Editorial (`dior`); bright-light — Swiss Modern (`default`), Bold Contemporary (`levis`), Vibrant Retail (`ikea`), and Pop Retail (`coca-cola`).

**Semantic tokens available** (consumed as Tailwind utilities):
- `bg-background`, `bg-surface`, `bg-surface-elevated`
- `text-foreground`, `text-foreground-muted`
- `border-border`, `border-border-strong`
- `bg-primary`, `text-primary-foreground`
- `bg-secondary`, `text-secondary-foreground`
- `bg-muted`, `text-muted-foreground`
- `bg-success`, `bg-warning`, `bg-danger` (and `-foreground` variants)

---

## API Client

All network requests go through `src/services/api/client.ts`.

- Base URL from `NEXT_PUBLIC_API_URL`
- Bearer token from `localStorage` (client-side only)
- Automatic silent token refresh on 401
- Normalized error responses — never exposes stack traces
- Dispatches `kromic:session-expired` event when refresh fails

Feature API modules (`store.ts`, `auth.ts`, `cart.ts`) are thin wrappers.
Add new feature modules as needed in Phase 3+.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Yes | Kromic Commerce API base URL |
| `NEXT_PUBLIC_APP_URL` | Yes | This frontend's public URL |
| `NEXT_PUBLIC_ENV` | No | `development` / `staging` / `production` |
| `SHOPEY_STORE_THEME` | No | Server-only fixed catalog ID for this customer deployment; defaults to `default` |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Phase 6 | Razorpay public key only |

### Customer storefront themes

Theme setup is registry driven. Add or tailor a `StoreThemeDefinition` in `src/theme/index.ts`: set its brand palette, typography, optional theme logo, and presentation recipe (header, hero, categories, featured products, catalog cards, and footer). The shared storefront components render those recipes, so a customer theme does not require a fork of the shopping UI. The uploaded business logo in store settings takes precedence over the theme fallback logo. Assign the resulting theme ID to `SHOPEY_STORE_THEME` for that customer's deployment. In development, `NEXT_PUBLIC_THEME_SWITCHER=true` enables previewing all registry entries; previews are not persisted to production.

**Never expose:** Razorpay secret, Google OAuth secret, Brevo credentials, JWT signing secrets, database credentials.

---

## Phase Roadmap

| Phase | Status | Description |
|---|---|---|
| 1 | ✅ Complete | Foundation, design system, API client, UI primitives |
| 2 | Pending | Storefront shell, home page |
| 3 | Pending | Product catalog, filters, search |
| 4 | Pending | Product detail page |
| 5 | Pending | Cart + customer authentication |
| 6 | Pending | Checkout + Razorpay |
| 7 | Pending | Customer account + orders |
| 8 | Pending | Admin panel |
| 9 | Pending | Admin UX polish |
| 10 | Pending | Production hardening |
