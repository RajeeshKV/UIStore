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

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handler = (e: MouseEvent) => {
      if (e.target === el) onClose();
    };
    el.addEventListener("click", handler);
    return () => el.removeEventListener("click", handler);
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      className={cn(
        "w-full max-w-lg rounded-xl border border-border bg-background shadow-xl",
        "p-0 backdrop:bg-foreground/20 backdrop:backdrop-blur-sm",
        "open:animate-scale-in",
        className,
      )}
    >
      <div className="flex items-start justify-between border-b border-border px-6 py-4">
        <div>
          <h2 className="text-h4 font-semibold text-foreground">{title}</h2>
          {description && (
            <p className="mt-1 text-body-sm text-foreground-muted">{description}</p>
          )}
        </div>
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="ml-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-foreground-muted hover:bg-muted hover:text-foreground transition-colors"
        >
          <X className="size-4" />
        </button>
      </div>
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
        <div className="flex justify-end gap-3">
          <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant={confirmVariant}
            size="sm"
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </AdminDialog>
  );
}
