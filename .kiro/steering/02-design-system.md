# Design System

The UI should resemble a premium ecommerce product: clean black/white interface with colorful imagery.

## Semantic tokens

Use tokens such as:

- `background`
- `surface`
- `surfaceElevated`
- `foreground`
- `muted`
- `border`
- `primary`
- `primaryForeground`
- `accent`
- `success`
- `warning`
- `danger`
- `focus`

Prefer CSS variables/Tailwind semantic tokens. Never hard-code customer colors in JSX/TSX.

## Typography

Use a clean modern sans-serif with strong hierarchy: editorial hero, page heading, section heading, product title, price and supporting metadata. Avoid excessive font weights and unreadably small text.

## Surfaces

Favor whitespace, subtle borders and restrained shadows. Product cards should not look like generic SaaS cards.

## Images

Product imagery is content and must remain sharp and colorful. Do not apply grayscale, low-opacity overlays or unnecessary filters.

## Icons

Use Lucide consistently. Icons support the content; they should not dominate it.
