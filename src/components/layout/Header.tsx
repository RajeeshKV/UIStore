"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, User, ShoppingBag, Heart, Menu, X, ChevronDown, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { fadeDown } from "@/lib/motion";
import { useAuth } from "@/features/auth/AuthContext";

interface NavItem {
  label: string;
  href: string;
  children?: { label: string; href: string }[];
}

const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "Categories", href: "/categories" },
  { label: "Brands", href: "/brands" },
  { label: "New Arrivals", href: "/shop?sort=newest" },
  { label: "Sale", href: "/shop?sale=true" },
];

interface HeaderProps {
  cartCount?: number;
  storeName?: string;
  logoUrl?: string | null;
  onCartClick?: () => void;
  hasBrands?: boolean;
}

export function Header({
  cartCount = 0,
  storeName = "Shopey Store",
  logoUrl,
  onCartClick,
  hasBrands = true,
}: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const navItems = NAV_ITEMS.filter(
    (item) => !(item.label === "Brands" && !hasBrands),
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeMobile = () => setMobileOpen(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full bg-background/98 backdrop-blur-sm",
        "border-b border-border transition-shadow duration-200",
        scrolled && "shadow-sm",
      )}
    >
      <div className="container-x mx-auto">
        {/* ── Main row ─────────────────────────────────────────── */}
        <div className="flex h-14 md:h-16 items-center gap-3 md:gap-4">

          {/* Logo */}
          <Link
            href="/"
            className="shrink-0 flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus rounded"
            aria-label={`${storeName} — home`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoUrl ?? "/logo-large.png"}
              alt={storeName}
              className="h-8 md:h-9 w-auto object-contain"
            />
          </Link>

          {/* Desktop nav */}
          <nav
            aria-label="Main navigation"
            className="hidden md:flex items-center gap-0 ml-2"
          >
            {navItems.map((item) => (
              <DesktopNavItem key={item.label} item={item} />
            ))}
          </nav>

          {/* Search bar — expands in the center/right */}
          <form
            role="search"
            onSubmit={handleSearch}
            className="hidden md:flex flex-1 max-w-md ml-auto items-center"
          >
            <div className="relative w-full">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-foreground-muted pointer-events-none"
                aria-hidden="true"
              />
              <input
                ref={searchRef}
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for products, brands and more..."
                aria-label="Search"
                className={cn(
                  "w-full h-9 rounded-md border border-border bg-surface",
                  "pl-8 pr-3 text-body-sm text-foreground",
                  "placeholder:text-foreground-muted text-[13px]",
                  "focus:outline-none focus:border-foreground/40 transition-colors",
                )}
              />
            </div>
          </form>

          {/* Right actions */}
          <div className="ml-auto md:ml-4 flex items-center gap-0.5">
            {/* Account */}
            <AccountButton />

            {/* Wishlist */}
            <HeaderIconButton label="Wishlist" href="/account">
              <Heart className="size-[18px]" />
            </HeaderIconButton>

            {/* Cart */}
            <HeaderIconButton
              label={`Cart${cartCount > 0 ? ` (${cartCount} items)` : ""}`}
              href={onCartClick ? undefined : "/cart"}
              onClick={onCartClick}
              badge={cartCount}
            >
              <ShoppingBag className="size-[18px]" />
            </HeaderIconButton>

            {/* Mobile search */}
            <MobileSearchButton />

            {/* Mobile menu toggle */}
            <button
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav"
              onClick={() => setMobileOpen((o) => !o)}
              className={cn(
                "md:hidden flex h-8 w-8 items-center justify-center rounded-md",
                "text-foreground hover:bg-muted transition-colors duration-150",
              )}
            >
              {mobileOpen ? <X className="size-4.5" /> : <Menu className="size-4.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            id="mobile-nav"
            aria-label="Mobile navigation"
            variants={fadeDown}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="md:hidden border-t border-border bg-background"
          >
            {/* Mobile search */}
            <div className="container-x mx-auto pt-3 pb-1">
              <form
                role="search"
                onSubmit={handleSearch}
                className="relative"
              >
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-foreground-muted pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products, brands..."
                  aria-label="Search"
                  className={cn(
                    "w-full h-9 rounded-md border border-border bg-surface",
                    "pl-8 pr-3 text-body-sm text-foreground text-[13px]",
                    "placeholder:text-foreground-muted",
                    "focus:outline-none focus:border-foreground/40 transition-colors",
                  )}
                />
              </form>
            </div>
            <ul className="container-x mx-auto py-2 flex flex-col">
              {navItems.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    onClick={closeMobile}
                    className={cn(
                      "flex items-center py-2.5 text-body-sm font-medium text-foreground",
                      "border-b border-border last:border-none",
                      "hover:text-foreground-muted transition-colors",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

// ── Desktop nav item ──────────────────────────────────────────────────────────

function DesktopNavItem({ item }: { item: NavItem }) {
  const [open, setOpen] = useState(false);

  if (!item.children?.length) {
    return (
      <Link
        href={item.href}
        className={cn(
          "px-2.5 py-1.5 text-[13px] font-medium text-foreground",
          "hover:text-foreground/60 rounded transition-colors duration-150",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
        )}
      >
        {item.label}
      </Link>
    );
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        aria-expanded={open}
        aria-haspopup="true"
        className={cn(
          "flex items-center gap-1 px-2.5 py-1.5 text-[13px] font-medium text-foreground",
          "hover:text-foreground/60 rounded transition-colors duration-150",
        )}
      >
        {item.label}
        <ChevronDown
          className={cn(
            "size-3 transition-transform duration-150",
            open && "rotate-180",
          )}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            variants={fadeDown}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className={cn(
              "absolute top-full left-0 mt-1 w-44 rounded-lg",
              "border border-border bg-background shadow-md py-1",
            )}
          >
            {item.children.map((child) => (
              <Link
                key={child.label}
                href={child.href}
                className="block px-3 py-2 text-[13px] text-foreground-muted hover:bg-muted hover:text-foreground transition-colors"
              >
                {child.label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Header icon button ────────────────────────────────────────────────────────

interface HeaderIconButtonProps {
  label: string;
  href?: string;
  onClick?: () => void;
  badge?: number;
  children: React.ReactNode;
}

function HeaderIconButton({ label, href, onClick, badge, children }: HeaderIconButtonProps) {
  const cls = cn(
    "relative flex h-8 w-8 items-center justify-center rounded-md",
    "text-foreground hover:bg-muted transition-colors duration-150",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
  );

  const inner = (
    <>
      {children}
      {badge != null && badge > 0 && (
        <span
          aria-hidden="true"
          className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground leading-none"
        >
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} aria-label={label} className={cls}>
        {inner}
      </Link>
    );
  }

  return (
    <button type="button" aria-label={label} onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}

// ── Mobile search button (opens inline search) ───────────────────────────────

function MobileSearchButton() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/shop?search=${encodeURIComponent(query.trim())}`);
      setOpen(false);
      setQuery("");
    }
  };

  return (
    <>
      <button
        aria-label="Search"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "md:hidden flex h-8 w-8 items-center justify-center rounded-md",
          "text-foreground hover:bg-muted transition-colors duration-150",
        )}
      >
        <Search className="size-[18px]" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            variants={fadeDown}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="md:hidden fixed inset-x-0 top-14 z-50 bg-background border-b border-border px-4 py-3 shadow-md"
          >
            <form role="search" onSubmit={handleSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-foreground-muted pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  autoFocus
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search products, brands..."
                  aria-label="Search"
                  className={cn(
                    "w-full h-9 rounded-md border border-border bg-surface",
                    "pl-8 pr-3 text-body-sm text-foreground text-[13px]",
                    "placeholder:text-foreground-muted",
                    "focus:outline-none focus:border-foreground/40 transition-colors",
                  )}
                />
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-[13px] text-foreground-muted hover:text-foreground px-2"
              >
                Cancel
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Account button ────────────────────────────────────────────────────────────

function AccountButton() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = () => setMenuOpen(false);
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  if (!mounted || isLoading) {
    return (
      <HeaderIconButton label="Sign in" href="/auth/login">
        <User className="size-[18px]" />
      </HeaderIconButton>
    );
  }

  if (!isAuthenticated) {
    return (
      <Link
        href="/auth/login"
        aria-label="Sign in"
        className={cn(
          "hidden md:flex items-center gap-1.5 h-8 px-3 rounded-md",
          "text-[13px] font-medium text-foreground hover:bg-muted transition-colors",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
        )}
      >
        <User className="size-[15px]" aria-hidden="true" />
        Account
      </Link>
    );
  }

  const initials = user?.firstName
    ? user.firstName[0].toUpperCase()
    : user?.email
    ? user.email[0].toUpperCase()
    : "A";

  const displayName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.email ?? "Account";

  return (
    <div className="relative">
      <button
        aria-label="Account menu"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((o) => !o)}
        className={cn(
          "relative flex h-8 w-8 items-center justify-center rounded-md",
          "text-foreground hover:bg-muted transition-colors duration-150",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
        )}
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
          {initials}
        </span>
      </button>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            variants={fadeDown}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="absolute right-0 top-full mt-1 z-50 w-52 rounded-lg border border-border bg-background shadow-md py-1"
          >
            <div className="px-4 py-2.5 border-b border-border">
              <p className="text-[13px] font-medium text-foreground truncate">{displayName}</p>
              {user?.email && (
                <p className="text-[11px] text-foreground-muted truncate">{user.email}</p>
              )}
            </div>
            <Link
              href="/account"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-[13px] text-foreground-muted hover:bg-muted hover:text-foreground transition-colors"
            >
              <User className="size-3.5" />
              My Account
            </Link>
            <Link
              href="/account/orders"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-[13px] text-foreground-muted hover:bg-muted hover:text-foreground transition-colors"
            >
              <ShoppingBag className="size-3.5" />
              My Orders
            </Link>
            <div className="border-t border-border my-1" />
            <button
              onClick={async () => {
                setMenuOpen(false);
                await logout();
                router.push("/");
              }}
              className="flex w-full items-center gap-2 px-4 py-2 text-[13px] text-foreground-muted hover:bg-danger/5 hover:text-danger transition-colors"
            >
              <LogOut className="size-3.5" />
              Sign Out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
