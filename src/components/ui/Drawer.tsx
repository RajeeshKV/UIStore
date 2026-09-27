"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { overlayBackdrop, slideInRight, slideInLeft } from "@/lib/motion";
import { cn } from "@/lib/utils";

type DrawerSide = "right" | "left";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  side?: DrawerSide;
  /** Width class, e.g. "w-80" or "max-w-md w-full" */
  width?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function Drawer({
  open,
  onClose,
  title,
  side = "right",
  width = "w-full max-w-sm",
  children,
  footer,
}: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const slideVariants = side === "right" ? slideInRight : slideInLeft;

  return (
    <AnimatePresence>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className="fixed inset-0 z-50 flex"
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            variants={overlayBackdrop}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            className={cn(
              "absolute inset-y-0 flex flex-col",
              "bg-surface-elevated border-border shadow-xl",
              side === "right"
                ? "right-0 border-l"
                : "left-0 border-r",
              width,
            )}
            variants={slideVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              {title && (
                <h2 className="text-h4 text-foreground">{title}</h2>
              )}
              <button
                onClick={onClose}
                aria-label="Close drawer"
                className={cn(
                  "ml-auto rounded-md p-1.5 text-foreground-muted",
                  "hover:bg-muted hover:text-foreground",
                  "transition-colors duration-150",
                )}
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-5">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="shrink-0 px-5 py-4 border-t border-border">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
