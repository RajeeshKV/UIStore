# Kromic Store — Deployment Guide

## Overview

The frontend is a Next.js 16 application deployed to **Vercel**.
The backend is a separate .NET API hosted independently.
Each customer gets their own Vercel project + backend instance.

```
Git repository
    └─ Vercel project (per customer)
            └─ Next.js production build
                    └─ Kromic Commerce API (customer-specific)
```

---

## Prerequisites

| Requirement | Version |
|---|---|
| Node.js | 20.9.0 or later |
| npm | 10.0.0 or later |
| Next.js | 16.x (pinned in package.json) |

---

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Create local environment file
cp .env.example .env.local

# 3. Edit .env.local — set NEXT_PUBLIC_API_URL to your local backend
#    NEXT_PUBLIC_API_URL=http://localhost:5000

# 4. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Production Build (local verification)

```bash
npm run build
npm start
```

Always verify locally before deploying. The build must pass with zero errors.

---

## Required Environment Variables

Configure these in **Vercel → Project Settings → Environment Variables**.
Set each variable independently per environment (Development / Preview / Production).

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | **Yes** | Backend API base URL (no trailing slash) |
| `NEXT_PUBLIC_APP_URL` | **Yes** | This frontend's canonical public URL |
| `NEXT_PUBLIC_ENV` | No | `development` / `staging` / `production` |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Phase 6 | Razorpay publishable key ID only |

**Never set in Vercel:**
- Razorpay secret key
- Google OAuth client secret
- Brevo / email credentials
- Database connection strings
- JWT signing secrets

These belong in the backend environment only.

---

## Vercel Project Setup

### New project

1. Import the Git repository in the Vercel dashboard.
2. Framework preset: **Next.js** (auto-detected).
3. Build command: `npm run build` (default).
4. Output directory: `.next` (default).
5. Install command: `npm install` (default).
6. Node.js version: **20.x** — set in Project Settings → General.

### Environment variables

Add variables from the table above. Use separate values per environment:

```
NEXT_PUBLIC_API_URL
  Development : http://localhost:5000
  Preview     : https://api-preview.example.com
  Production  : https://api.example.com

NEXT_PUBLIC_APP_URL
  Development : http://localhost:3000
  Preview     : https://<vercel-preview-url>
  Production  : https://example.com
```

---

## Preview Deployments

Every Git branch push creates a Vercel preview deployment automatically.
Preview deployments use their own environment variables — configure the Preview
environment in Vercel to point at a staging backend API instance.

---

## Production Deployment

Push (or merge) to the production branch (typically `main`).
Vercel builds and deploys automatically.

To trigger a manual redeploy without a code change:
Vercel dashboard → Deployments → Redeploy.

---

## Backend CORS Configuration

The .NET backend must allow the Vercel frontend origin.

Required origins:
- `http://localhost:3000` (development)
- `https://<project>.vercel.app` (preview deployments)
- `https://yourcustomerdomain.com` (production)

Vercel preview URLs follow the pattern `https://<project>-<hash>-<team>.vercel.app`.
Configure the backend CORS policy to allow the Vercel project domain pattern,
or add specific origins per environment.

**Do not use a wildcard `*` CORS policy in production.**

---

## Remote Image Configuration

Product images are served from backend-configured URLs (Cloudinary, etc.).
`next.config.ts` allows images from any HTTPS hostname:

```ts
images: {
  remotePatterns: [{ protocol: "https", hostname: "**" }],
}
```

This is intentional for the multi-customer deployment model — customers may use
different CDN providers. If you need to restrict to specific domains for security,
replace `"**"` with explicit hostname patterns per customer deployment.

---

## Customer-Specific Deployment

The same codebase deploys for multiple customers. To create a new customer deployment:

1. Create a new Vercel project from the same Git repository.
2. Set `NEXT_PUBLIC_API_URL` to the customer's backend API URL.
3. Set `NEXT_PUBLIC_APP_URL` to the customer's domain.
4. Configure a custom domain in Vercel if needed.
5. The customer's store name, logo, colors, contact info, and policies
   all come from their backend via `GET /api/v1/store/settings`.

**No source code changes are required between customer deployments.**

---

## Vercel Configuration File

No `vercel.json` is required. Next.js App Router routes work natively on Vercel.
Dynamic routes (`/categories/[slug]`, `/brands/[slug]`) are handled by Next.js
and deploy correctly without additional rewrite rules.

---

## Troubleshooting

### Build fails with "Module not found"
Run `npm install` locally and confirm `node_modules` is not committed.

### API calls return CORS errors
Add the Vercel domain to the backend CORS allowed origins list.

### Images fail to load
Confirm the image URL hostname is accessible over HTTPS.
`next/image` requires HTTPS remote sources in production.

### Dynamic routes return 404
Verify the route folder name uses square brackets: `[slug]`.
No `vercel.json` rewrites are needed — App Router handles this natively.

### Environment variables not available at runtime
`NEXT_PUBLIC_*` variables are inlined at build time.
If you change them in Vercel, trigger a new deployment for the change to take effect.
