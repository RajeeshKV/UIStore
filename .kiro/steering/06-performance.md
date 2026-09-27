# Performance

The storefront must feel fast with real product data.

- Lazy-load below-the-fold images.
- Use responsive image sizing.
- Avoid unnecessary JavaScript and global state.
- Use backend pagination.
- Debounce search where appropriate.
- Avoid duplicate API requests.
- Keep animations lightweight.
- Do not render huge product collections unnecessarily.

Hero imagery can load eagerly when critical to the first viewport. Other imagery should generally be lazy loaded.
