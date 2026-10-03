import type { NextConfig } from "next";

/**
 * Kromic Store — Next.js Configuration
 *
 * Deployment target: Vercel (default Next.js output, no custom server).
 * Backend: Kromic Commerce API hosted separately (cross-origin fetch from server components).
 * Images: served via Next.js Image Optimization from any HTTPS source.
 */
const nextConfig: NextConfig = {
  // ── No caching — all pages and API calls go to the network on every request ─
  // cache: "no-store" on every fetch in the API client handles request-level caching.
  // force-dynamic on every page handles route-level caching.
  experimental: {
    staleTimes: {
      dynamic: 0,
      // static minimum is 30 per Next.js; compensated by force-dynamic on all pages
      // + cache: "no-store" on all API fetches in client.ts.
      static: 30,
    },
  },

  // ── Images ──────────────────────────────────────────────────────────────────
  // Allow images from any HTTPS hostname (Cloudinary, backend CDN, Unsplash, etc.)
  // Customer-specific domains do not need to be hardcoded — the wildcard covers all.
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    // Keep quality options broad enough for editorial and product photography
    qualities: [50, 75, 90],
  },

  // ── Security headers ─────────────────────────────────────────────────────────
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options",  value: "nosniff" },
          { key: "X-Frame-Options",          value: "DENY" },
          { key: "Referrer-Policy",          value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },

  // ── Logging (Vercel build output) ────────────────────────────────────────────
  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === "development",
    },
  },
};

export default nextConfig;
