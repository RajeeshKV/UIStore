# Development Workflow

Before a major feature:

1. Read relevant steering files and skills.
2. Read the relevant backend API documentation.
3. Inspect existing components and tokens.
4. Define desktop and mobile behavior.
5. Define loading, empty, error and success states.
6. Implement using reusable primitives.
7. Run build/type checks.
8. Perform visual review.

Recommended order: foundation → storefront shell → catalog → product → cart/checkout → customer → admin → production hardening.

A page is not complete merely because its happy path works. Check loading, empty, error, disabled, mobile, desktop, keyboard, focus, theme and animation states.

Do not accept technically functional but visually unfinished UI.
