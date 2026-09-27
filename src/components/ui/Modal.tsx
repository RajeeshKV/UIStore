"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { overlayBackdrop, modalPanel } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  /** Max width class, e.g. "max-w-md" */
  size?: string;
  children: React.ReactNode;
  /** Hide the close button */
  hideClose?: boolean;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  size = "max-w-md",
  children,
  hideClose = false,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Trap focus within modal
  useEffect(() => {
    if (!open || !panelRef.current) return;
    const firstFocusable = panelRef.current.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    firstFocusable?.focus();
  }, [open]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? "modal-title" : undefined}
          aria-describedby={description ? "modal-desc" : undefined}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            variants={overlayBackdrop}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            ref={panelRef}
            className={cn(
              "relative z-10 w-full rounded-xl bg-surface-elevated",
              "border border-border shadow-xl",
              "max-h-[90vh] overflow-y-auto",
              size,
            )}
            variants={modalPanel}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Header */}
            {(title || !hideClose) && (
              <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4 border-b border-border">
                <div>
                  {title && (
                    <h2 id="modal-title" className="text-h4 text-foreground">
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p id="modal-desc" className="text-body-sm text-foreground-muted mt-1">
                      {description}
                    </p>
                  )}
                </div>
                {!hideClose && (
                  <button
                    onClick={onClose}
                    aria-label="Close dialog"
                    className={cn(
                      "rounded-md p-1.5 text-foreground-muted",
                      "hover:bg-muted hover:text-foreground",
                      "transition-colors duration-150 shrink-0",
                    )}
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>
            )}

            {/* Content */}
            <div className="px-6 py-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
