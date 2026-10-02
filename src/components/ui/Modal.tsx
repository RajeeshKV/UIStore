"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  /** Max width class, e.g. "max-w-md" */
  size?: string;
  children: React.ReactNode;
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
  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            {/* Backdrop */}
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
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
                  "fixed left-1/2 top-1/2 z-50 w-full -translate-x-1/2 -translate-y-1/2",
                  "rounded-2xl bg-white border border-border shadow-xl",
                  "max-h-[90vh] overflow-y-auto p-0",
                  size,
                )}
                initial={{ opacity: 0, scale: 0.96, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 8 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* Header */}
                {(title || !hideClose) && (
                  <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4 border-b border-border">
                    <div>
                      {title && (
                        <Dialog.Title className="text-[16px] font-bold text-foreground tracking-tight">
                          {title}
                        </Dialog.Title>
                      )}
                      {description && (
                        <Dialog.Description className="text-[13px] text-foreground-muted mt-1">
                          {description}
                        </Dialog.Description>
                      )}
                    </div>
                    {!hideClose && (
                      <Dialog.Close
                        aria-label="Close dialog"
                        className={cn(
                          "shrink-0 rounded-full w-7 h-7 flex items-center justify-center",
                          "text-foreground-muted hover:bg-surface-container hover:text-foreground",
                          "transition-colors duration-150",
                        )}
                      >
                        <X className="size-4" />
                      </Dialog.Close>
                    )}
                  </div>
                )}

                {/* Content */}
                <div className="px-6 py-5">{children}</div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
