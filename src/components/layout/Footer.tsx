import Link from "next/link";
import {
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PublicBusinessSettingsResponse, StorePolicyResponse } from "@/types/api";

interface FooterProps {
  settings?: PublicBusinessSettingsResponse | null;
  policies?: StorePolicyResponse[];
}

export function Footer({ settings, policies = [] }: FooterProps) {
  const year = new Date().getFullYear();
  const name = settings?.businessName ?? "Kromic";

  return (
    <footer
      className="border-t border-border bg-surface mt-auto"
      aria-label="Site footer"
    >
      <div className="container-x mx-auto py-12 md:py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand / About */}
          <div className="flex flex-col gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={settings?.logoUrl ?? "/logo-large.png"}
              alt={name}
              className="h-12 w-auto object-contain object-left"
            />
            {settings?.address && (
              <address className="not-italic flex items-start gap-2 text-body-sm text-foreground-muted">
                <MapPin className="size-4 mt-0.5 shrink-0" aria-hidden="true" />
                <span>{settings.address}</span>
              </address>
            )}
            {settings?.supportEmail && (
              <a
                href={`mailto:${settings.supportEmail}`}
                className="flex items-center gap-2 text-body-sm text-foreground-muted hover:text-foreground transition-colors"
              >
                <Mail className="size-4 shrink-0" aria-hidden="true" />
                {settings.supportEmail}
              </a>
            )}
            {settings?.supportPhone && (
              <a
                href={`tel:${settings.supportPhone}`}
                className="flex items-center gap-2 text-body-sm text-foreground-muted hover:text-foreground transition-colors"
              >
                <Phone className="size-4 shrink-0" aria-hidden="true" />
                {settings.supportPhone}
              </a>
            )}

            {/* Social icons */}
            <SocialLinks settings={settings} />
          </div>

          {/* Shop */}
          <div className="flex flex-col gap-3">
            <h3 className="text-label font-semibold text-foreground uppercase tracking-wider">
              Shop
            </h3>
            <FooterLink href="/shop">All Products</FooterLink>
            <FooterLink href="/categories">Categories</FooterLink>
            <FooterLink href="/brands">Brands</FooterLink>
            <FooterLink href="/shop?sort=newest">New Arrivals</FooterLink>
            <FooterLink href="/shop?sale=true">Sale</FooterLink>
          </div>

          {/* Account */}
          <div className="flex flex-col gap-3">
            <h3 className="text-label font-semibold text-foreground uppercase tracking-wider">
              Account
            </h3>
            <FooterLink href="/account">My Account</FooterLink>
            <FooterLink href="/account/orders">My Orders</FooterLink>
            <FooterLink href="/account/addresses">Addresses</FooterLink>
            <FooterLink href="/auth/login">Sign In</FooterLink>
          </div>

          {/* Policies */}
          {policies.length > 0 && (
            <div className="flex flex-col gap-3">
              <h3 className="text-label font-semibold text-foreground uppercase tracking-wider">
                Information
              </h3>
              {policies.map((policy) => (
                <FooterLink key={policy.id} href={`/policies/${(policy.policyType ?? "policy").toLowerCase()}`}>
                  {policy.title ?? policy.policyType}
                </FooterLink>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border container-x mx-auto py-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-caption text-foreground-muted">
          <p>
            © {year} {name}. All rights reserved.
          </p>
          {policies.length > 0 && (
            <nav aria-label="Policy links" className="flex flex-wrap gap-4">
              {policies.map((p) => (
                <Link
                  key={p.id}
                  href={`/policies/${(p.policyType ?? "policy").toLowerCase()}`}
                  className="hover:text-foreground transition-colors"
                >
                  {p.title ?? p.policyType}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </div>
    </footer>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="text-body-sm text-foreground-muted hover:text-foreground transition-colors w-fit"
    >
      {children}
    </Link>
  );
}

function SocialLinks({
  settings,
}: {
  settings?: PublicBusinessSettingsResponse | null;
}) {
  const links = [
    { href: settings?.instagramUrl, label: "Instagram" },
    { href: settings?.facebookUrl, label: "Facebook" },
    { href: settings?.linkedInUrl, label: "LinkedIn" },
    {
      href: settings?.whatsAppNumber
        ? `https://wa.me/${settings.whatsAppNumber.replace(/\D/g, "")}`
        : undefined,
      label: "WhatsApp",
    },
    { href: settings?.twitterUrl, label: "X / Twitter" },
    { href: settings?.youtubeUrl, label: "YouTube" },
  ].filter((l) => l.href);

  if (!links.length) return null;

  return (
    <div className="flex items-center gap-3 mt-1">
      {links.map((l) => (
        <a
          key={l.label}
          href={l.href!}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={l.label}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-md",
            "text-foreground-muted hover:text-foreground hover:bg-muted",
            "transition-colors duration-150 text-caption font-semibold",
          )}
        >
          {l.label.slice(0, 2)}
        </a>
      ))}
    </div>
  );
}
