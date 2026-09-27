# API Integration Rules

`API-Reference.md` is the source of truth. Before implementing a feature, read its endpoint, request/response shape, auth requirement, validation and errors.

Create a centralized API client. Feature APIs should sit in the relevant feature/service layer.

Backend authority includes pricing, effective variant price, stock, promotions, tax, shipping, COD, checkout totals, payment state and order state. Client calculations are display-only.

Normalize validation, auth, authorization, conflict, rate-limit, server and network errors. Never display stack traces.

Never expose JWT signing secrets, Razorpay secrets, Google client secrets, Cloudinary secrets, Brevo keys or database credentials.

If frontend work reveals a genuine missing backend capability, document it and make a small backend change rather than duplicating backend business logic in the browser.
