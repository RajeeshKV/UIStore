"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle, AlertCircle, Info, XCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

type ToastType = "success" | "error" | "warning" | "info";

interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextValue {
  toast: (item: Omit<ToastItem, "id">) => void;
  success: (title: string, description?: string) => void;
  error:   (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  info:    (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counterRef = useRef(0);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((item: Omit<ToastItem, "id">) => {
    const id = `toast-${++counterRef.current}`;
    setToasts((prev) => [...prev.slice(-4), { ...item, id }]);
    const duration = item.duration ?? 4000;
    if (duration > 0) setTimeout(() => remove(id), duration);
  }, [remove]);

  const success = useCallback((title: string, description?: string) => toast({ type: "success", title, description }), [toast]);
  const error   = useCallback((title: string, description?: string) => toast({ type: "error",   title, description, duration: 6000 }), [toast]);
  const warning = useCallback((title: string, description?: string) => toast({ type: "warning", title, description }), [toast]);
  const info    = useCallback((title: string, description?: string) => toast({ type: "info",    title, description }), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="fixed bottom-5 right-5 z-[60] flex flex-col gap-2 pointer-events-none w-full max-w-[360px]"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <ToastCard key={t.id} item={t} onDismiss={() => remove(t.id)} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

const iconMap: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="size-4 text-success shrink-0" />,
  error:   <XCircle     className="size-4 text-danger  shrink-0" />,
  warning: <AlertCircle className="size-4 text-warning shrink-0" />,
  info:    <Info        className="size-4 text-foreground-muted shrink-0" />,
};

const borderMap: Record<ToastType, string> = {
  success: "border-l-4 border-l-success  border-border",
  error:   "border-l-4 border-l-danger   border-border",
  warning: "border-l-4 border-l-warning  border-border",
  info:    "border-l-4 border-l-border-strong border-border",
};

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  return (
    <motion.div
      layout
      role="status"
      aria-live="polite"
      className={cn(
        "pointer-events-auto flex items-start gap-3",
        "rounded-xl bg-surface-elevated shadow-[0_8px_24px_-4px_rgba(0,0,0,0.1)]",
        "px-4 py-3 border border-border",
        borderMap[item.type],
      )}
      initial={{ opacity: 0, y: 12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0,  scale: 1    }}
      exit={   { opacity: 0, y: 8,  scale: 0.96 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
    >
      <span className="mt-0.5">{iconMap[item.type]}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-foreground">{item.title}</p>
        {item.description && (
          <p className="text-[12px] text-foreground-muted mt-0.5">{item.description}</p>
        )}
      </div>
      <button
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="text-foreground-muted hover:text-foreground transition-colors mt-0.5 shrink-0"
      >
        <X className="size-3.5" />
      </button>
    </motion.div>
  );
}
