# Product Vision

Build a premium reusable ecommerce frontend for separate customer deployments. The supplied visual reference is the main visual direction, but the implementation must be original rather than a pixel copy.

## Visual direction

- Monochrome UI chrome: black, white and refined neutrals.
- Product/content imagery stays fully colorful. Never grayscale product photography.
- Modern, minimal, futuristic, editorial and premium.
- Generous whitespace and strong typography.
- Thin borders, restrained shadows and controlled rounding.
- Smooth but fast interactions.

Avoid generic Bootstrap/Material ecommerce styling, excessive gradients, heavy glassmorphism, neon effects, giant rounded SaaS cards, excessive shadows and random animation.

## Customer deployment

The same codebase is deployed separately for different customers. Customer branding must be configuration-driven. At minimum support theme colors, logo and optional typography through a central theme configuration. Components must never contain customer-specific colors.

## Backend authority

Use the existing `API-Reference.md` as the API contract. The backend remains authoritative for prices, effective variant prices, inventory, promotions, tax, shipping, COD fees, checkout totals, payments, orders, authorization and store configuration. Do not duplicate business rules in the frontend.
