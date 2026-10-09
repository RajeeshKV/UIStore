"use client";

/**
 * DevThemeSwitcher — dev-only floating theme toggle.
 *
 * Only imported/rendered in development (see layout.tsx).
 * Applies selected theme as data-theme on <html>.
 * Persists in localStorage under "kromic_dev_theme".
 */

import { useEffect, useState } from "react";

const STORAGE_KEY = "kromic_dev_theme";

const THEMES = [
  { id: "default",   label: "Default",    dot: "#191c1e" },
  { id: "luxe",      label: "Luxe",       dot: "#a88752" },
  { id: "starbucks", label: "Starbucks",  dot: "#006241" },
  { id: "levis",     label: "Levi's",     dot: "#17365d" },
  { id: "ikea",      label: "IKEA",       dot: "#0058a3" },
  { id: "sephora",   label: "Sephora",    dot: "#d4007a" },
  { id: "patagonia", label: "Patagonia",  dot: "#4a7c59" },
  { id: "tiffany",   label: "Tiffany",    dot: "#0abab5" },
  { id: "adidas",    label: "Adidas",     dot: "#000000" },
  { id: "coca-cola", label: "Coca-Cola",  dot: "#e8002d" },
  { id: "amazon",    label: "Amazon",     dot: "#ff9900" },
  { id: "dior",      label: "Dior",       dot: "#c8a96e" },
] as const;

type ThemeId = typeof THEMES[number]["id"];

function applyTheme(id: ThemeId) {
  const html = document.documentElement;
  if (id === "default") {
    html.removeAttribute("data-theme");
  } else {
    html.setAttribute("data-theme", id);
  }
}

// Inner component — hooks called unconditionally here
function ThemeSwitcherInner() {
  const [current, setCurrent] = useState<ThemeId>("default");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as ThemeId | null;
    if (saved && THEMES.some((t) => t.id === saved)) {
      setCurrent(saved);
      applyTheme(saved);
    }
  }, []);

  function select(id: ThemeId) {
    setCurrent(id);
    applyTheme(id);
    localStorage.setItem(STORAGE_KEY, id);
    setOpen(false);
  }

  const currentTheme = THEMES.find((t) => t.id === current) ?? THEMES[0];

  return (
    <div
      className="fixed bottom-20 right-5 z-[9999] flex flex-col items-end gap-1"
      aria-label="Dev theme switcher"
    >
      {/* Dropdown — opens upward */}
      {open && (
        <div className="flex flex-col gap-0.5 rounded-xl border border-[#e1e2e4] bg-white shadow-xl p-1.5 min-w-[130px] max-h-[60vh] overflow-y-auto">
          <p className="px-2.5 pt-1 pb-1.5 text-[9px] font-bold tracking-widest uppercase text-[#747878]">
            Theme
          </p>
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => select(t.id)}
              className={[
                "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[12px] font-medium text-left w-full transition-colors",
                current === t.id
                  ? "bg-[#0D0D0D] text-white"
                  : "hover:bg-[#f3f4f6] text-[#191c1e]",
              ].join(" ")}
            >
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0 ring-1 ring-black/10"
                style={{ background: t.dot }}
                aria-hidden="true"
              />
              {t.label}
              {current === t.id && (
                <span className="ml-auto text-[10px] opacity-70">✓</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Trigger pill */}
      <button
        onClick={() => setOpen((o) => !o)}
        title="Dev: Switch theme"
        className="flex items-center gap-2 rounded-full bg-[#0D0D0D] text-white text-[11px] font-mono px-3 py-1.5 shadow-lg hover:bg-[#262626] active:scale-95 transition-all"
      >
        <span
          className="h-2 w-2 rounded-full shrink-0"
          style={{ background: currentTheme.dot }}
          aria-hidden="true"
        />
        {currentTheme.label}
      </button>
    </div>
  );
}

// Outer wrapper — guards the env check outside of any hook
export function DevThemeSwitcher() {
  // Enabled when NEXT_PUBLIC_THEME_SWITCHER=true.
  // Set it in .env.local or in Vercel → Environment Variables for any
  // environment where you want to preview themes (dev, staging, preview).
  // Never set it to true in production.
  if (process.env.NEXT_PUBLIC_THEME_SWITCHER !== "true") return null;
  return <ThemeSwitcherInner />;
}
