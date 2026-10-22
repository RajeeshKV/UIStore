"use client";

import { useEffect, useState } from "react";
import { isThemeId, themeCatalog, type ThemeId } from "@/theme";

const STORAGE_KEY = "kromic_dev_theme";

function applyTheme(id: ThemeId) {
  const html = document.documentElement;
  if (id === "default") html.removeAttribute("data-theme");
  else html.setAttribute("data-theme", id);
}

function ThemeSwitcherInner({ initialTheme }: { initialTheme: ThemeId }) {
  const [current, setCurrent] = useState<ThemeId>(initialTheme);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (isThemeId(saved)) {
      setCurrent(saved);
      applyTheme(saved);
    } else {
      applyTheme(initialTheme);
    }
  }, [initialTheme]);

  function select(id: ThemeId) {
    setCurrent(id);
    applyTheme(id);
    localStorage.setItem(STORAGE_KEY, id);
    setOpen(false);
  }

  const currentTheme = themeCatalog.find((theme) => theme.id === current) ?? themeCatalog[0];

  return (
    <div className="fixed bottom-20 right-5 z-[9999] flex flex-col items-end gap-1" aria-label="Dev theme switcher">
      {open && (
        <div className="flex max-h-[60vh] min-w-[190px] flex-col gap-0.5 overflow-y-auto rounded-xl border border-border bg-surface-elevated p-1.5 shadow-xl">
          <p className="px-2.5 pb-1.5 pt-1 text-[9px] font-bold uppercase tracking-widest text-foreground-muted">Theme preview · choose a family</p>
          <button onClick={() => select(initialTheme)} className="mx-1 mb-1 rounded-lg border border-border px-2 py-1.5 text-left text-[10px] font-semibold text-foreground hover:bg-surface">Restore deployment theme</button>
          {themeCatalog.map((theme) => (
            <button key={theme.id} onClick={() => select(theme.id)} aria-pressed={current === theme.id}
              className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[12px] font-medium transition-colors ${current === theme.id ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-surface"}`}>
              <span className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-black/10" style={{ background: theme.swatch }} aria-hidden="true" />
              <span className="min-w-0 flex-1"><span className="block">{theme.name}</span><span className="block truncate text-[10px] opacity-70">{theme.family} · {theme.description}</span></span>
              {current === theme.id && <span className="text-[10px] opacity-70">✓</span>}
            </button>
          ))}
        </div>
      )}
      <button onClick={() => setOpen((value) => !value)} aria-expanded={open} title="Development theme preview"
        className="flex items-center gap-2 rounded-full bg-primary px-3 py-1.5 font-mono text-[11px] text-primary-foreground shadow-lg transition-all hover:bg-primary/90 active:scale-95">
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: currentTheme.swatch }} aria-hidden="true" />
        Preview: {currentTheme.name}
      </button>
    </div>
  );
}

export function DevThemeSwitcher({ initialTheme }: { initialTheme: ThemeId }) {
  if (process.env.NODE_ENV !== "development" || process.env.NEXT_PUBLIC_THEME_SWITCHER !== "true") return null;
  return <ThemeSwitcherInner initialTheme={initialTheme} />;
}
