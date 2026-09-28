import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PublicBusinessSettingsResponse, StorePolicyResponse } from "@/types/api";

interface FooterProps {
  settings?: PublicBusinessSettingsResponse | null;
  policies?: StorePolicyResponse[];
}

export function Footer({ settings, policies }: FooterProps) {
  const year = new Date().getFullYear();
  const name = settings?.businessName ?? "Kromic";
  const policyList = policies ?? [];

  // Determine if we have any contact info to show
  const hasContact =
    settings?.address ||
    settings?.supportEmail ||
    settings?.supportPhone ||
    settings?.whatsAppNumber;

  return (
    <footer className="border-t border-border bg-surface mt-auto" aria-label="Site footer">
      <div className="container-x mx-auto py-12 md:py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">

          {/* ── Brand / About ─────────────────────────────────────── */}
          <div className="flex flex-col gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={settings?.logoUrl ?? "/logo-large.png"}
              alt={name}
              className="h-12 w-auto object-contain object-left"
            />
            {settings?.legalName && settings.legalName !== settings.businessName && (
              <p className="text-caption text-foreground-muted">{settings.legalName}</p>
            )}
            {settings?.websiteUrl && (
              <a
                href={settings.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-body-sm text-foreground-muted hover:text-foreground transition-colors w-fit"
              >
                {settings.websiteUrl.replace(/^https?:\/\//, "")}
              </a>
            )}
            {/* Social icons row */}
            <SocialLinks settings={settings} />
          </div>

          {/* ── Shop ──────────────────────────────────────────────── */}
          <div className="flex flex-col gap-3">
            <h3 className="text-label font-semibold text-foreground uppercase tracking-wider">Shop</h3>
            <FooterLink href="/shop">All Products</FooterLink>
            <FooterLink href="/categories">Categories</FooterLink>
            <FooterLink href="/brands">Brands</FooterLink>
            <FooterLink href="/shop?sort=newest">New Arrivals</FooterLink>
            <FooterLink href="/shop?sale=true">Sale</FooterLink>
          </div>

          {/* ── Contact Us ────────────────────────────────────────── */}
          {hasContact && (
            <div className="flex flex-col gap-3">
              <h3 className="text-label font-semibold text-foreground uppercase tracking-wider">Contact Us</h3>

              {settings?.address && (
                <address className="not-italic flex items-start gap-2.5 text-body-sm text-foreground-muted">
                  <MapPin className="size-4 mt-0.5 shrink-0 text-foreground-muted" aria-hidden="true" />
                  <span className="leading-relaxed">{settings.address}</span>
                </address>
              )}

              {settings?.supportEmail && (
                <a
                  href={`mailto:${settings.supportEmail}`}
                  className="flex items-center gap-2.5 text-body-sm text-foreground-muted hover:text-foreground transition-colors"
                >
                  <Mail className="size-4 shrink-0" aria-hidden="true" />
                  {settings.supportEmail}
                </a>
              )}

              {settings?.supportPhone && (
                <a
                  href={`tel:${settings.supportPhone}`}
                  className="flex items-center gap-2.5 text-body-sm text-foreground-muted hover:text-foreground transition-colors"
                >
                  <Phone className="size-4 shrink-0" aria-hidden="true" />
                  {settings.supportPhone}
                </a>
              )}

              {settings?.whatsAppNumber && (
                <a
                  href={`https://wa.me/${settings.whatsAppNumber.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 text-body-sm text-foreground-muted hover:text-foreground transition-colors"
                >
                  <IconWhatsApp className="size-4 shrink-0" />
                  {settings.whatsAppNumber}
                </a>
              )}
            </div>
          )}

          {/* ── Policies / Account ────────────────────────────────── */}
          <div className="flex flex-col gap-3">
            <h3 className="text-label font-semibold text-foreground uppercase tracking-wider">Account</h3>
            <FooterLink href="/account">My Account</FooterLink>
            <FooterLink href="/account/orders">My Orders</FooterLink>
            <FooterLink href="/account/addresses">Addresses</FooterLink>
            <FooterLink href="/auth/login">Sign In</FooterLink>

            {policyList.length > 0 && (
              <>
                <h3 className="text-label font-semibold text-foreground uppercase tracking-wider mt-4">Information</h3>
                {policyList.map((policy) => (
                  <FooterLink
                    key={policy.id}
                    href={`/policies/${(policy.policyType ?? "policy").toLowerCase()}`}
                  >
                    {policy.title ?? policy.policyType}
                  </FooterLink>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom bar ──────────────────────────────────────────────── */}
      <div className="border-t border-border">
        <div className="container-x mx-auto py-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-caption text-foreground-muted">
          {/* Copyright — left */}
          <p className="shrink-0">© {year} {name}. All rights reserved.</p>

          {/* Social icons — center */}
          <SocialLinks settings={settings} />

          {/* Policy links — right */}
          {policyList.length > 0 ? (
            <nav aria-label="Policy links" className="flex flex-wrap gap-4 justify-end shrink-0">
              {policyList.map((p) => (
                <Link
                  key={p.id}
                  href={`/policies/${(p.policyType ?? "policy").toLowerCase()}`}
                  className="hover:text-foreground transition-colors"
                >
                  {p.title ?? p.policyType}
                </Link>
              ))}
            </nav>
          ) : (
            <span aria-hidden="true" className="shrink-0" />
          )}
        </div>
      </div>
    </footer>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-body-sm text-foreground-muted hover:text-foreground transition-colors w-fit">
      {children}
    </Link>
  );
}

// ── Social links with proper branded icons ─────────────────────────────────────

interface SocialLink {
  href: string;
  label: string;
  icon: React.ReactNode;
}

function SocialLinks({ settings }: { settings?: PublicBusinessSettingsResponse | null }) {
  const links: SocialLink[] = [
    settings?.instagramUrl && {
      href: settings.instagramUrl,
      label: "Instagram",
      icon: <IconInstagram className="size-4.5" />,
    },
    settings?.facebookUrl && {
      href: settings.facebookUrl,
      label: "Facebook",
      icon: <IconFacebook className="size-4.5" />,
    },
    settings?.whatsAppNumber && {
      href: `https://wa.me/${settings.whatsAppNumber.replace(/\D/g, "")}`,
      label: "WhatsApp",
      icon: <IconWhatsApp className="size-4.5" />,
    },
    settings?.linkedInUrl && {
      href: settings.linkedInUrl,
      label: "LinkedIn",
      icon: <IconLinkedIn className="size-4.5" />,
    },
    settings?.twitterUrl && {
      href: settings.twitterUrl,
      label: "X / Twitter",
      icon: <IconXTwitter className="size-4.5" />,
    },
    settings?.youtubeUrl && {
      href: settings.youtubeUrl,
      label: "YouTube",
      icon: <IconYouTube className="size-4.5" />,
    },
  ].filter(Boolean) as SocialLink[];

  if (!links.length) return null;

  return (
    <div className="flex items-center gap-2 mt-1" aria-label="Social media links">
      {links.map((l) => (
        <a
          key={l.label}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={l.label}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg",
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

// ── Branded SVG icons ──────────────────────────────────────────────────────────
// Inline SVGs — no package dependency, pixel-perfect brand icons.

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

function IconWhatsApp({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
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

function IconXTwitter({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
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
