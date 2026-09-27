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
    ├── index.ts          # Customer theme config (swap here for new customer)
    └── tokens.ts         # Semantic color token names
```

---

## Theme System

All customer branding is driven by CSS custom properties in `src/app/globals.css`.

**To deploy for a new customer:**
1. Update the `:root` block in `globals.css` with the customer's palette
2. Update `src/theme/index.ts` with the customer's name, logo path, and font preferences
3. No component code changes required

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
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Phase 6 | Razorpay public key only |

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
