"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { SORT_OPTIONS } from "@/types/catalog";
import { useState } from "react";

interface CatalogSortProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function CatalogSort({ value, onChange, className }: CatalogSortProps) {
  const [open, setOpen] = useState(false);
  const selected = SORT_OPTIONS.find((o) => o.value === value) ?? SORT_OPTIONS[0];

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger asChild>
        <button
          className={cn(
            "flex items-center gap-2 h-11 px-5 rounded-full",
            "bg-surface-elevated border border-border shadow-sm",
            "text-[13px] font-medium text-foreground",
            "hover:shadow-md transition-all duration-150",
            "focus-visible:outline-2 focus-visible:outline-primary",
            className,
          )}
          aria-label="Sort products"
        >
          <span className="text-foreground-muted">Sort:</span>
          <span className="font-bold text-foreground">{selected.label}</span>
          <ChevronDown
            className={cn(
              "size-4 text-foreground-muted transition-transform duration-200",
              open && "rotate-180",
            )}
            aria-hidden="true"
          />
        </button>
      </DropdownMenu.Trigger>

      <AnimatePresence>
        {open && (
          <DropdownMenu.Portal forceMount>
            <DropdownMenu.Content asChild align="end" sideOffset={6}>
              <motion.div
                className="z-50 w-52 rounded-2xl bg-surface-elevated border border-border shadow-[0_8px_24px_rgba(0,0,0,0.08)] py-1.5 overflow-hidden"
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              >
                {SORT_OPTIONS.map((opt) => (
                  <DropdownMenu.Item
                    key={opt.value}
                    onSelect={() => onChange(opt.value)}
                    className={cn(
                      "flex items-center justify-between px-4 py-2.5 cursor-pointer outline-none",
                      "text-[13px] transition-colors",
                      opt.value === value
                        ? "text-foreground font-bold bg-muted"
                        : "text-foreground-muted hover:bg-muted hover:text-foreground",
                    )}
                  >
                    {opt.label}
                    {opt.value === value && (
                      <Check className="size-3.5 text-foreground shrink-0" aria-hidden="true" />
                    )}
                  </DropdownMenu.Item>
                ))}
              </motion.div>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        )}
      </AnimatePresence>
    </DropdownMenu.Root>
  );
}
