"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { PublicBusinessSettingsResponse, StorePolicyResponse } from "@/types/api";

interface FooterProps {
  settings?: PublicBusinessSettingsResponse | null;
  policies?: StorePolicyResponse[];
}

export function Footer({ settings, policies }: FooterProps) {
  const year = new Date().getFullYear();
  const name = settings?.businessName ?? "Shopey";
  const policyList = policies ?? [];

  return (
    <footer className="border-t border-border bg-surface mt-auto" aria-label="Site footer">
      <div className="container-x mx-auto py-10 md:py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">

          {/* ── Brand column ──────────────────────────────────────── */}
          <div className="sm:col-span-2 lg:col-span-1 xl:col-span-2 flex flex-col gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={settings?.logoUrl ?? "/logo-large.png"}
              alt={name}
              className="h-9 w-auto object-contain object-left"
            />
            <p className="text-[13px] text-foreground-muted leading-relaxed max-w-[260px]">
              Premium products for a smarter, better tomorrow.
            </p>
            {/* Social icons */}
            <SocialIcons settings={settings} />

            {/* Newsletter */}
            <NewsletterForm />
          </div>

          {/* ── Shop ──────────────────────────────────────────────── */}
          <div className="flex flex-col gap-3">
            <h3 className="text-[13px] font-semibold text-foreground">Shop</h3>
            <FooterLink href="/shop">All Products</FooterLink>
            <FooterLink href="/categories">Categories</FooterLink>
            <FooterLink href="/brands">Brands</FooterLink>
            <FooterLink href="/shop?sort=newest">New Arrivals</FooterLink>
            <FooterLink href="/shop?sale=true">Sale</FooterLink>
          </div>

          {/* ── Support ───────────────────────────────────────────── */}
          <div className="flex flex-col gap-3">
            <h3 className="text-[13px] font-semibold text-foreground">Support</h3>
            <FooterLink href="/account/orders">Track Order</FooterLink>
            {policyList.some((p) => p.policyType?.toLowerCase().includes("shipping")) ? (
              <FooterLink href={`/policies/shipping`}>Shipping Policy</FooterLink>
            ) : (
              <FooterLink href="/shop">Shipping Policy</FooterLink>
            )}
            {policyList.some((p) => p.policyType?.toLowerCase().includes("refund")) ? (
              <FooterLink href="/policies/refund">Returns &amp; Refunds</FooterLink>
            ) : (
              <FooterLink href="/shop">Returns &amp; Refunds</FooterLink>
            )}
            <FooterLink href="/shop">FAQs</FooterLink>
            {settings?.supportEmail ? (
              <a
                href={`mailto:${settings.supportEmail}`}
                className="text-[13px] text-foreground-muted hover:text-foreground transition-colors w-fit"
              >
                Contact Us
              </a>
            ) : (
              <FooterLink href="/shop">Contact Us</FooterLink>
            )}
          </div>

          {/* ── Account ───────────────────────────────────────────── */}
          <div className="flex flex-col gap-3">
            <h3 className="text-[13px] font-semibold text-foreground">Account</h3>
            <FooterLink href="/account">My Account</FooterLink>
            <FooterLink href="/account/orders">My Orders</FooterLink>
            <FooterLink href="/account">Wishlist</FooterLink>
            <FooterLink href="/account/addresses">Addresses</FooterLink>
            <FooterLink href="/auth/login">Sign In / Register</FooterLink>
            {policyList.some((p) => p.policyType?.toLowerCase().includes("help")) && (
              <FooterLink href="/policies/help">Help</FooterLink>
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom bar ──────────────────────────────────────────────── */}
      <div className="border-t border-border">
        <div className="container-x mx-auto py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[12px] text-foreground-muted">
            © {year} {name}. All rights reserved.
          </p>
          {/* Policy links */}
          <nav aria-label="Policy links" className="flex flex-wrap gap-x-4 gap-y-1 justify-center sm:justify-end">
            {policyList.length > 0 ? (
              policyList.map((p) => (
                <Link
                  key={p.id}
                  href={`/policies/${(p.policyType ?? "policy").toLowerCase()}`}
                  className="text-[12px] text-foreground-muted hover:text-foreground transition-colors"
                >
                  {p.title ?? p.policyType}
                </Link>
              ))
            ) : (
              <>
                <span className="text-[12px] text-foreground-muted">Privacy Policy</span>
                <span className="text-[12px] text-foreground-muted">Terms &amp; Conditions</span>
              </>
            )}
          </nav>
        </div>
      </div>
    </footer>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-[13px] text-foreground-muted hover:text-foreground transition-colors w-fit"
    >
      {children}
    </Link>
  );
}

// ── Newsletter form ────────────────────────────────────────────────────────────

function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      // No backend endpoint yet — acknowledge locally
      setSent(true);
    }
  };

  return (
    <div>
      <p className="text-[13px] font-semibold text-foreground mb-1">
        Subscribe to our newsletter
      </p>
      <p className="text-[12px] text-foreground-muted mb-2">
        Get updates on new products and exclusive offers.
      </p>
      {sent ? (
        <p className="text-[13px] font-medium text-success">Thanks for subscribing!</p>
      ) : (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            aria-label="Email address for newsletter"
            className={cn(
              "flex-1 h-8 min-w-0 rounded-md border border-border bg-background",
              "px-3 text-[12px] text-foreground placeholder:text-foreground-muted",
              "focus:outline-none focus:border-foreground/40 transition-colors",
            )}
          />
          <button
            type="submit"
            className={cn(
              "h-8 shrink-0 px-3 rounded-md text-[12px] font-semibold",
              "bg-foreground text-background hover:bg-foreground/85 transition-colors",
            )}
          >
            Subscribe
          </button>
        </form>
      )}
    </div>
  );
}

// ── Social icons ──────────────────────────────────────────────────────────────

interface SocialLink {
  href: string;
  label: string;
  icon: React.ReactNode;
}

function SocialIcons({ settings }: { settings?: PublicBusinessSettingsResponse | null }) {
  const links: SocialLink[] = [
    settings?.instagramUrl && {
      href: settings.instagramUrl,
      label: "Instagram",
      icon: <IconInstagram className="size-4" />,
    },
    settings?.facebookUrl && {
      href: settings.facebookUrl,
      label: "Facebook",
      icon: <IconFacebook className="size-4" />,
    },
    settings?.youtubeUrl && {
      href: settings.youtubeUrl,
      label: "YouTube",
      icon: <IconYouTube className="size-4" />,
    },
    settings?.twitterUrl && {
      href: settings.twitterUrl,
      label: "X / Twitter",
      icon: <IconXTwitter className="size-4" />,
    },
    settings?.linkedInUrl && {
      href: settings.linkedInUrl,
      label: "LinkedIn",
      icon: <IconLinkedIn className="size-4" />,
    },
  ].filter(Boolean) as SocialLink[];

  if (!links.length) {
    // Show placeholder social icons matching the reference
    return (
      <div className="flex items-center gap-1" aria-hidden="true">
        {[
          <IconInstagram key="ig" className="size-4" />,
          <IconFacebook key="fb" className="size-4" />,
          <IconYouTube key="yt" className="size-4" />,
          <IconXTwitter key="tw" className="size-4" />,
          <IconLinkedIn key="li" className="size-4" />,
        ].map((icon, i) => (
          <span
            key={i}
            className="flex h-7 w-7 items-center justify-center rounded-md text-foreground-muted"
          >
            {icon}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1" aria-label="Social media links">
      {links.map((l) => (
        <a
          key={l.label}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={l.label}
          title={l.label}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-md",
            "text-foreground-muted hover:text-foreground hover:bg-muted",
            "transition-colors duration-150",
          )}
        >
          {l.icon}
        </a>
      ))}
    </div>
  );
}

// ── SVG brand icons ───────────────────────────────────────────────────────────

function IconInstagram({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
    </svg>
  );
}

function IconFacebook({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function IconYouTube({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function IconXTwitter({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
  );
}

function IconLinkedIn({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}
