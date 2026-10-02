"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
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
  const xEnter = side === "right" ? "100%" : "-100%";
  const xExit  = side === "right" ? "100%" : "-100%";

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            {/* Backdrop */}
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
            </Dialog.Overlay>

            {/* Panel */}
            <Dialog.Content asChild>
              <motion.div
                className={cn(
                  "fixed inset-y-0 z-50 flex flex-col",
                  "bg-white border-border shadow-xl",
                  side === "right" ? "right-0 border-l" : "left-0 border-r",
                  width,
                )}
                initial={{ x: xEnter, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: xExit, opacity: 0 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
                  {title && (
                    <Dialog.Title className="text-[16px] font-bold text-foreground tracking-tight">
                      {title}
                    </Dialog.Title>
                  )}
                  <Dialog.Close
                    aria-label="Close drawer"
                    className={cn(
                      "ml-auto rounded-full w-7 h-7 flex items-center justify-center",
                      "text-foreground-muted hover:bg-surface-container hover:text-foreground",
                      "transition-colors duration-150",
                    )}
                  >
                    <X className="size-4" />
                  </Dialog.Close>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>

                {/* Footer */}
                {footer && (
                  <div className="shrink-0 px-5 py-4 border-t border-border">{footer}</div>
                )}
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
