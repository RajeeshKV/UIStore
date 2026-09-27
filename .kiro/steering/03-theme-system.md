# Customer Theme System

Customer-specific branding must be switchable without editing component code.

Create one central theme configuration containing:

- theme name
- primary and primary foreground
- accent
- background/surface/elevated surface
- foreground/muted/border
- success/warning/danger/focus
- logo and favicon
- optional typography settings

Use semantic CSS variables. Components consume semantic tokens rather than hex values.

The default theme is monochrome. Future customers may use brand palettes derived from their logos. Keep the architecture ready for this without implementing automatic color extraction now.

Every palette must maintain accessible contrast.
