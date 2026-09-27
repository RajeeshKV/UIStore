# Admin Panel Guidelines

The admin panel uses the same theme system but prioritizes operational efficiency.

Use clean navigation, readable dense tables, forms, filters, pagination, status badges, confirmation dialogs, toast feedback and skeleton loading.

Build only against actual backend APIs. Expected areas include authentication, products, categories, brands, images, inventory, orders, promotions, tax, store settings, customer profile/addresses and policies.

Destructive actions such as delete, archive, deactivate, cancel and refund require clear confirmation.

Admin tables need loading, empty, error, pagination and supported filtering/sorting states. Do not invent client-side filtering where the API already provides server-side filtering.

Sensitive provider values must never be displayed in full.
