"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, User, ShoppingBag, Menu, X, ChevronDown, LogOut } from "lucide-react";
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
  {
    label: "Categories",
    href: "/categories",
  },
  { label: "Brands", href: "/brands" },
  { label: "New Arrivals", href: "/shop?sort=newest" },
  { label: "Sale", href: "/shop?sale=true" },
];

interface HeaderProps {
  /** Cart item count — passed from cart store */
  cartCount?: number;
  /** Store name for fallback if no logo */
  storeName?: string;
  /** Logo URL from store settings */
  logoUrl?: string | null;
  /** Opens cart drawer instead of navigating to /cart */
  onCartClick?: () => void;
  /** Hide the Brands nav item when the store has no brands */
  hasBrands?: boolean;
}

export function Header({
  cartCount = 0,
  storeName = "Kromic",
  logoUrl,
  onCartClick,
  hasBrands = true,
}: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Filter nav items based on store configuration
  const navItems = NAV_ITEMS.filter(
    (item) => !(item.label === "Brands" && !hasBrands),
  );

  // Scroll shadow
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on route change (when a link is clicked)
  const closeMobile = () => setMobileOpen(false);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full bg-background/95 backdrop-blur-sm",
        "border-b border-border transition-shadow duration-200",
        scrolled && "shadow-sm",
      )}
    >
      <div className="container-x mx-auto">
        {/* Main row */}
        <div className="flex h-16 items-center gap-4 md:h-20">
          {/* Logo / brand name */}
          <Link
            href="/"
            className="shrink-0 flex items-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus rounded"
            aria-label={`${storeName} — home`}
          >
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt={storeName}
                className="h-12 md:h-14 w-auto object-contain"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src="/logo-large.png"
                alt={storeName}
                className="h-12 md:h-14 w-auto object-contain"
              />
            )}
          </Link>

          {/* Desktop nav */}
          <nav
            aria-label="Main navigation"
            className="hidden md:flex items-center gap-0.5 ml-6"
          >
            {navItems.map((item) => (
              <DesktopNavItem key={item.label} item={item} />
            ))}
          </nav>

          {/* Right actions */}
          <div className="ml-auto flex items-center gap-1">
            {/* Search */}
            <HeaderIconButton
              label="Search"
              onClick={() => setSearchOpen((s) => !s)}
            >
              <Search className="size-4.5" />
            </HeaderIconButton>

            {/* Account — shows auth state */}
            <AccountButton />

            {/* Cart */}
            <HeaderIconButton
              label={`Cart${cartCount > 0 ? ` (${cartCount} items)` : ""}`}
              href={onCartClick ? undefined : "/cart"}
              onClick={onCartClick}
              badge={cartCount}
            >
              <ShoppingBag className="size-4.5" />
            </HeaderIconButton>

            {/* Mobile menu toggle */}
            <button
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav"
              onClick={() => setMobileOpen((o) => !o)}
              className={cn(
                "md:hidden flex h-9 w-9 items-center justify-center rounded-md",
                "text-foreground hover:bg-muted transition-colors duration-150",
              )}
            >
              {mobileOpen ? (
                <X className="size-5" />
              ) : (
                <Menu className="size-5" />
              )}
            </button>
          </div>
        </div>

        {/* Search bar */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              variants={fadeDown}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="pb-3 md:pb-4"
            >
              <SearchBar onClose={() => setSearchOpen(false)} />
            </motion.div>
          )}
        </AnimatePresence>
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
            <ul className="container-x mx-auto py-3 flex flex-col">
              {navItems.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    onClick={closeMobile}
                    className={cn(
                      "flex items-center py-3 text-body font-medium text-foreground",
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
          "px-3 py-2 text-body-sm font-medium text-foreground",
          "hover:text-foreground/70 rounded-md transition-colors duration-150",
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
          "flex items-center gap-1 px-3 py-2 text-body-sm font-medium text-foreground",
          "hover:text-foreground/70 rounded-md transition-colors duration-150",
        )}
      >
        {item.label}
        <ChevronDown
          className={cn(
            "size-3.5 transition-transform duration-150",
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
              "absolute top-full left-0 mt-1 w-48 rounded-lg",
              "border border-border bg-surface-elevated shadow-lg py-1",
            )}
          >
            {item.children?.map((child) => (
              <Link
                key={child.label}
                href={child.href}
                className="block px-4 py-2 text-body-sm text-foreground hover:bg-muted transition-colors"
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

// ── Icon button ───────────────────────────────────────────────────────────────

interface HeaderIconButtonProps {
  label: string;
  href?: string;
  badge?: number;
  onClick?: () => void;
  children: React.ReactNode;
}

function HeaderIconButton({
  label,
  href,
  badge,
  onClick,
  children,
}: HeaderIconButtonProps) {
  const classes = cn(
    "relative flex h-9 w-9 items-center justify-center rounded-md",
    "text-foreground hover:bg-muted transition-colors duration-150",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
  );

  const content = (
    <>
      {children}
      {badge != null && badge > 0 && (
        <span
          aria-hidden="true"
          className={cn(
            "absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center",
            "rounded-full bg-primary px-1",
            "text-[10px] font-semibold text-primary-foreground leading-none",
          )}
        >
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} aria-label={label} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button aria-label={label} onClick={onClick} className={classes}>
      {content}
    </button>
  );
}

// ── Account button (auth-aware) ───────────────────────────────────────────────

function AccountButton() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  // Only render auth-aware UI after hydration to avoid SSR mismatch.
  // Server has no auth state, so we always render the unauthenticated
  // state on first pass — matching what the server sends.
  useEffect(() => { setMounted(true); }, []);

  // Close on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = () => setMenuOpen(false);
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  // Before hydration or while loading: show plain user icon (matches SSR)
  if (!mounted || isLoading) {
    return (
      <HeaderIconButton label="Sign in" href="/auth/login">
        <User className="size-4.5" />
      </HeaderIconButton>
    );
  }

  if (!isAuthenticated) {
    return (
      <HeaderIconButton label="Sign in" href="/auth/login">
        <User className="size-4.5" />
      </HeaderIconButton>
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
          "relative flex h-9 w-9 items-center justify-center rounded-md",
          "text-foreground hover:bg-muted transition-colors duration-150",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
        )}
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-caption font-semibold">
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
            className="absolute right-0 top-full mt-1 z-50 w-52 rounded-lg border border-border bg-background shadow-lg py-1"
          >
            <div className="px-4 py-2.5 border-b border-border">
              <p className="text-body-sm font-medium text-foreground truncate">{displayName}</p>
              {user?.email && (
                <p className="text-caption text-foreground-muted truncate">{user.email}</p>
              )}
            </div>
            <Link
              href="/account"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-body-sm text-foreground-muted hover:bg-muted hover:text-foreground transition-colors"
            >
              <User className="size-3.5" />
              My Account
            </Link>
            <Link
              href="/account/orders"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-body-sm text-foreground-muted hover:bg-muted hover:text-foreground transition-colors"
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
              className="flex w-full items-center gap-2 px-4 py-2 text-body-sm text-foreground-muted hover:bg-danger/5 hover:text-danger transition-colors"
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

// ── Search bar ────────────────────────────────────────────────────────────────

function SearchBar({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/shop?search=${encodeURIComponent(query.trim())}`);
      onClose();
    }
  };

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className="flex items-center gap-2"
    >
      <div className="relative flex-1">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-foreground-muted pointer-events-none"
          aria-hidden="true"
        />
        <input
          type="search"
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products, brands, categories…"
          aria-label="Search"
          className={cn(
            "w-full rounded-md border border-border bg-surface-elevated",
            "pl-9 pr-4 py-2 text-body text-foreground",
            "placeholder:text-foreground-muted",
            "focus:outline-none focus:border-foreground transition-colors",
          )}
        />
      </div>
      <button
        type="button"
        onClick={onClose}
        className="text-body-sm text-foreground-muted hover:text-foreground transition-colors px-2 py-2"
      >
        Cancel
      </button>
    </form>
  );
}
