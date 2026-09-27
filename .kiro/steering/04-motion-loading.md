# Motion, Loading and Interaction

Motion should communicate hierarchy and state, never slow the user down.

Use subtle fade, translate and scale transitions, smooth drawers, product-image hover transitions and clear button feedback. Avoid theatrical animation and large layout movement. Prefer transform and opacity.

Skeleton loading is mandatory for data-driven screens. Skeletons should resemble the final layout rather than being a generic full-page spinner.

Use skeletons for home sections, catalogs, product detail, cart, checkout, orders, profile and later admin tables. Use inline progress indicators for mutations.

Respect `prefers-reduced-motion`: remove non-essential animation and never make the UI dependent on motion.

Smooth scrolling may be used where appropriate, but never at the expense of browser behavior, keyboard navigation or accessibility.
