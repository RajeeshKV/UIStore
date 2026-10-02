"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, User, ShoppingBag, Heart, Menu, X, ChevronDown, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { fadeDown } from "@/lib/motion";
import { useAuth } from "@/features/auth/AuthContext";

interface NavItem {
  label: string;
  href: string;
  isSale?: boolean;
  children?: { label: string; href: string }[];
}

const NAV_ITEMS: NavItem[] = [
  { label: "Home",         href: "/" },
  { label: "Shop",         href: "/shop" },
  { label: "Categories",   href: "/categories" },
  { label: "Brands",       href: "/brands" },
  { label: "New Arrivals", href: "/shop?sort=newest" },
  { label: "Sale",         href: "/shop?sale=true", isSale: true },
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
  storeName = "Shopey",
  logoUrl,
  onCartClick,
  hasBrands = true,
}: HeaderProps) {
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [scrolled,   setScrolled]     = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router      = useRouter();
  const pathname    = usePathname();
  const searchParams = useSearchParams();
  // Convert search params to query string for active-nav matching
  const search = searchParams.toString() ? `?${searchParams.toString()}` : "";

  const navItems = NAV_ITEMS.filter(
    (item) => !(item.label === "Brands" && !hasBrands),
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setMobileOpen(false);
    }
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full",
        "bg-white/95 backdrop-blur-xl border-b border-[#e1e2e4]/60",
        "transition-shadow duration-300",
        scrolled && "shadow-[0_2px_12px_rgba(0,0,0,0.06)]",
      )}
    >
      {/*
        Full-width header — no max-w constraint on the outer shell.
        Inner content uses px padding to keep items away from edges.
        Layout: [Logo | flex-1 gap | Nav + Search | divider | Actions]
      */}
      <div className="w-full px-5 md:px-8 lg:px-10">
        <div className="flex h-14 md:h-16 items-center gap-0">

          {/* ── ZONE 1: Logo — hard left ────────────────────────────────── */}
          <Link
            href="/"
            className="shrink-0 flex items-center mr-8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D0D0D] rounded"
            aria-label={`${storeName} — home`}
          >
            {/* Both mobile and desktop use logo-large — icon+text always */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoUrl ?? "/logo-large.png"}
              alt={storeName}
              className="h-8 md:h-9 w-auto object-contain"
            />
          </Link>

          {/* ── ZONE 2: Nav + Search — fills middle ─────────────────────── */}
          <div className="hidden md:flex flex-1 items-center gap-5">
            {/* Nav */}
            <nav aria-label="Main navigation" className="hidden xl:flex items-center gap-6 shrink-0">
              {navItems.map((item) => (
                <DesktopNavItem key={item.label} item={item} pathname={pathname} search={search} />
              ))}
            </nav>

            {/* Search */}
            <form role="search" onSubmit={handleSearch} className="flex-1 max-w-[380px]">
              <div className="relative group">
                <Search
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 size-[15px] text-[#747878] group-focus-within:text-[#191c1e] transition-colors pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products, brands..."
                  aria-label="Search"
                  className={cn(
                    "w-full h-9 pl-9 pr-4 rounded-full",
                    "bg-[#f3f4f6] border border-transparent",
                    "text-[#191c1e] text-[13px] placeholder:text-[#747878]",
                    "focus:outline-none focus:bg-white focus:border-[#c4c7c7]",
                    "transition-all duration-200",
                  )}
                />
              </div>
            </form>
          </div>

          {/* ── ZONE 3: Account / Wishlist / Cart — hard right ──────────── */}
          {/* Left border creates clear visual separation from nav+search */}
          <div className="flex items-center gap-0.5 pl-4 ml-auto border-l border-[#e1e2e4]">
            {/* Account — visible on all sizes */}
            <AccountButton />

            {/* Wishlist — visible on all sizes */}
            <Link
              href="/account"
              aria-label="Wishlist"
              className="flex items-center justify-center h-9 w-9 rounded-full text-[#444748] hover:bg-[#f3f4f6] hover:text-[#191c1e] transition-all duration-150"
            >
              <Heart className="size-[18px]" aria-hidden="true" />
            </Link>

            {/* Cart — visible on all sizes */}
            <CartButton cartCount={cartCount} onCartClick={onCartClick} />

            {/* Mobile search icon */}
            <MobileSearchButton />

            {/* Mobile hamburger — xl:hidden */}
            <button
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav"
              onClick={() => setMobileOpen((o) => !o)}
              className="xl:hidden flex h-9 w-9 items-center justify-center rounded-full text-[#191c1e] hover:bg-[#f3f4f6] transition-colors"
            >
              {mobileOpen ? <X className="size-4.5" /> : <Menu className="size-4.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile nav ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            id="mobile-nav"
            aria-label="Mobile navigation"
            variants={fadeDown}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="xl:hidden border-t border-[#e1e2e4]/60 bg-white/95 backdrop-blur-xl"
          >
            {/* Mobile search */}
            <div className="px-5 md:px-8 lg:px-10 pt-4 pb-2">
              <form role="search" onSubmit={handleSearch} className="relative">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 size-[15px] text-[#444748] pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products, brands..."
                  aria-label="Search"
                  className={cn(
                    "w-full h-11 pl-10 pr-4 rounded-full",
                    "bg-[#edeef0] border border-transparent",
                    "text-[#191c1e] text-[14px] placeholder:text-[#444748]",
                    "focus:outline-none focus:bg-white focus:border-[#c4c7c7]/60",
                    "transition-all duration-200",
                  )}
                />
              </form>
            </div>
            <ul className="px-5 md:px-8 lg:px-10 py-2 flex flex-col">
              {navItems.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center py-3 text-[14px] font-semibold",
                      "border-b border-[#e1e2e4]/50 last:border-none",
                      item.isSale ? "text-[#ba0918]" : "text-[#191c1e]",
                      "hover:text-[#444748] transition-colors",
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

// ── Cart pill button ──────────────────────────────────────────────────────────

function CartButton({ cartCount, onCartClick }: { cartCount: number; onCartClick?: () => void }) {
  const label = `Cart${cartCount > 0 ? ` (${cartCount})` : ""}`;

  const cls = cn(
    "relative flex items-center gap-2 py-2 px-4 rounded-full",
    "bg-[#0D0D0D] text-white text-[13px] font-bold tracking-wide uppercase",
    "hover:bg-[#1c1b1b] hover:shadow-md transition-all duration-150",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D0D0D]",
    "hidden sm:flex",
  );

  const inner = (
    <>
      <ShoppingBag className="size-[18px]" aria-hidden="true" />
      <span className="hidden sm:inline">Cart</span>
      {cartCount > 0 && (
        <span
          aria-hidden="true"
          className="flex h-5 w-5 items-center justify-center rounded-full bg-[#ba0918] text-white text-[10px] font-extrabold leading-none shadow-sm"
        >
          {cartCount > 99 ? "99+" : cartCount}
        </span>
      )}
    </>
  );

  if (onCartClick) {
    return <button type="button" aria-label={label} onClick={onCartClick} className={cls}>{inner}</button>;
  }
  return <Link href="/cart" aria-label={label} className={cls}>{inner}</Link>;
}

// ── Desktop nav item ──────────────────────────────────────────────────────────

function DesktopNavItem({
  item,
  pathname,
  search,
}: {
  item: NavItem;
  pathname: string;
  search: string;
}) {
  const [open, setOpen] = useState(false);

  // Full current URL path+search for matching
  const fullUrl = search ? `${pathname}${search}` : pathname;

  const isActive = item.href === "/"
    ? pathname === "/"
    : item.href.includes("?")
    ? fullUrl === item.href
    : item.href === "/shop"
    ? pathname === "/shop" && !search.includes("sort=") && !search.includes("sale=")
    : pathname.startsWith(item.href);

  if (!item.children?.length) {
    return (
      <Link
        href={item.href}
        className={cn(
          "relative py-1 text-[14px] transition-colors duration-150",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D0D0D] rounded",
          item.isSale
            ? "font-semibold text-[#ba0918] hover:opacity-80"
            : isActive
            ? "font-bold text-[#191c1e]"
            : "font-medium text-[#444748] hover:text-[#191c1e]",
        )}
      >
        {item.label}
        {isActive && (
          <span
            aria-hidden="true"
            className={cn(
              "absolute left-0 bottom-0 h-[2px] w-full rounded-full",
              item.isSale ? "bg-[#ba0918]" : "bg-[#0D0D0D]",
            )}
          />
        )}
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
        className="flex items-center gap-1 py-1 text-[14px] font-medium text-[#444748] hover:text-[#191c1e] transition-colors"
      >
        {item.label}
        <ChevronDown className={cn("size-3.5 transition-transform duration-150", open && "rotate-180")} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            variants={fadeDown}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="absolute top-full left-0 mt-2 w-48 rounded-2xl border border-[#e1e2e4] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.08)] py-1.5 z-50"
          >
            {item.children.map((child) => (
              <Link
                key={child.label}
                href={child.href}
                className="block px-4 py-2.5 text-[13px] font-medium text-[#444748] hover:bg-[#f3f4f6] hover:text-[#191c1e] transition-colors"
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

// ── Account button ────────────────────────────────────────────────────────────

function AccountButton() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted]   = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router  = useRouter();

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const baseCls = cn(
    "flex items-center gap-1.5 px-2.5 py-2 rounded-full",
    "text-[#444748] hover:bg-[#f3f4f6] hover:text-[#191c1e]",
    "text-[13px] font-semibold transition-all duration-150",
  );

  if (!mounted || isLoading) {
    return (
      <Link href="/auth/login" className={baseCls}>
        <User className="size-[18px]" aria-hidden="true" />
        <span className="hidden md:inline">Account</span>
      </Link>
    );
  }

  if (!isAuthenticated) {
    return (
      <Link href="/auth/login" className={baseCls}>
        <User className="size-[18px]" aria-hidden="true" />
        <span className="hidden md:inline">Account</span>
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
    <div className="relative" ref={menuRef}>
      <button
        aria-label="Account menu"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((o) => !o)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-full text-[#444748] hover:bg-[#edeef0] hover:text-[#191c1e] transition-all duration-150"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0D0D0D] text-white text-[11px] font-bold shadow-sm">
          {initials}
        </span>
        <span className="hidden md:inline text-[13px] font-semibold">Account</span>
      </button>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            variants={fadeDown}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="absolute right-0 top-full mt-2 z-50 w-56 rounded-2xl border border-[#e1e2e4] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.08)] py-1.5"
          >
            <div className="px-4 py-3 border-b border-[#e1e2e4]">
              <p className="text-[13px] font-bold text-[#191c1e] truncate">{displayName}</p>
              {user?.email && (
                <p className="text-[11px] text-[#444748] truncate mt-0.5">{user.email}</p>
              )}
            </div>
            <Link href="/account" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-[#444748] hover:bg-[#f3f4f6] hover:text-[#191c1e] transition-colors">
              <User className="size-4" /> My Account
            </Link>
            <Link href="/account/orders" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-[#444748] hover:bg-[#f3f4f6] hover:text-[#191c1e] transition-colors">
              <ShoppingBag className="size-4" /> My Orders
            </Link>
            <div className="border-t border-[#e1e2e4] my-1" />
            <button
              onClick={async () => { setMenuOpen(false); await logout(); router.push("/"); }}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[13px] text-[#444748] hover:bg-danger/5 hover:text-danger transition-colors"
            >
              <LogOut className="size-4" /> Sign Out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Mobile search overlay ─────────────────────────────────────────────────────

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
        className="md:hidden flex h-9 w-9 items-center justify-center rounded-full text-[#444748] hover:bg-[#edeef0] transition-colors"
      >
        <Search className="size-[20px]" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            variants={fadeDown}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="md:hidden fixed inset-x-0 top-16 z-50 bg-white/95 backdrop-blur-xl border-b border-[#e1e2e4]/60 px-5 py-4 shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
          >
            <form role="search" onSubmit={handleSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-[15px] text-[#444748] pointer-events-none" aria-hidden="true" />
                <input
                  autoFocus
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search products, brands..."
                  aria-label="Search"
                  className={cn(
                    "w-full h-11 pl-10 pr-4 rounded-full",
                    "bg-[#edeef0] border border-transparent",
                    "text-[#191c1e] text-[14px] placeholder:text-[#444748]",
                    "focus:outline-none focus:bg-white focus:border-[#c4c7c7]/60",
                    "transition-all duration-200",
                  )}
                />
              </div>
              <button type="button" onClick={() => setOpen(false)} className="text-[13px] font-medium text-[#444748] hover:text-[#191c1e] px-2 transition-colors">
                Cancel
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
