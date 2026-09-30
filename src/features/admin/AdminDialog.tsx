"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

interface AdminDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function AdminDialog({
  open,
  onClose,
  title,
  description,
  children,
  className,
}: AdminDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open) {
      if (!el.open) el.showModal();
    } else {
      if (el.open) el.close();
    }
  }, [open]);

  // Close on backdrop click
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handler = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const outside =
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom;
      if (outside) onClose();
    };
    el.addEventListener("click", handler);
    return () => el.removeEventListener("click", handler);
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      className={cn(
        // Centered via CSS margin: auto (native <dialog> is already centered in modern browsers via UA sheet)
        // but we override to make it explicit and consistent.
        "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 m-0",
        "w-full max-w-lg rounded-2xl border border-border bg-background shadow-2xl",
        "p-0 backdrop:bg-foreground/30 backdrop:backdrop-blur-[2px]",
        "open:animate-scale-in",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
        <div className="min-w-0">
          <h2 className="text-body font-semibold text-foreground leading-snug">{title}</h2>
          {description && (
            <p className="mt-0.5 text-caption text-foreground-muted">{description}</p>
          )}
        </div>
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-foreground-muted hover:bg-muted hover:text-foreground transition-colors"
        >
          <X className="size-3.5" />
        </button>
      </div>

      {/* Body */}
      <div className="px-6 py-5">{children}</div>
    </dialog>
  );
}

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  confirmVariant?: "primary" | "danger";
  loading?: boolean;
  children?: React.ReactNode;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  confirmVariant = "danger",
  loading,
  children,
}: ConfirmDialogProps) {
  return (
    <AdminDialog open={open} onClose={onClose} title={title} className="max-w-sm">
      <div className="flex flex-col gap-5">
        {description && <p className="text-body-sm text-foreground-muted">{description}</p>}
        {children}
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant={confirmVariant} size="sm" onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </AdminDialog>
  );
}
