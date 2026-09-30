# KromicStore Frontend State

## Purpose

Keep this file short. It contains current frontend context that should not need to be rediscovered by an AI coding agent.

Update it when major frontend decisions or flows change.

## Current Architecture

- Frontend framework: React + Vite
- Language: TypeScript
- Styling/UI: Tailwind CSS and/or MUI according to the existing implementation
- Backend: .NET 8 API (outside this repository's implementation scope)
- Authentication: Use the existing frontend authentication implementation
- Payments: Razorpay integration through the existing backend API

## Important Product Areas

- Customer storefront
- Product browsing
- Categories
- Brands
- Product details
- Cart
- Checkout
- Address management
- Payment
- Orders
- Store administration
- Admin authentication
- Admin product/category/brand management

## Current Checkout Principles

- A customer should not have to re-enter an address unnecessarily.
- If checkout requires an address and the customer has no saved address, the frontend should provide a clear way to add/select the address according to the existing product flow.
- Payment configuration is managed through the admin area and consumed through the backend API.
- Payment failures must expose the actual actionable error instead of silently failing.

## Agent Notes

- Prefer existing components and API services.
- Do not redesign unrelated screens.
- Keep changes narrowly scoped.
- Update this document only when a lasting frontend decision changes.
