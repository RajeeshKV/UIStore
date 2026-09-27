# Frontend Architecture

Use React + Vite + TypeScript + Tailwind CSS + Motion/Framer Motion + Lucide icons.

Prefer feature-oriented, composable architecture:

- `src/components/ui` — reusable primitives
- `src/components/layout` — shells/navigation
- `src/features` — auth, catalog, cart, checkout, orders, profile, admin
- `src/services/api` — centralized API client and feature API functions
- `src/hooks` — reusable hooks
- `src/stores` — only genuinely global client state
- `src/theme` — theme tokens/configuration
- `src/types` — shared frontend types
- `src/pages` — route-level composition

Do not scatter raw fetch calls through components. Do not build giant page components. Do not add state libraries without a clear need.

Create reusable primitives such as Button, Input, Dialog, Drawer, Toast, Skeleton, Badge, Breadcrumb, Pagination, ProductCard, ProductGrid, Price, QuantitySelector, EmptyState and ErrorState.

Never expose backend secrets. Never trust client-provided totals.
