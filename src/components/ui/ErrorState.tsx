"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
  inline?: boolean;
}

export function ErrorState({
  title = "Something went wrong",
  description = "We couldn't load this content. Please try again.",
  onRetry,
  className,
  inline = false,
}: ErrorStateProps) {
  if (inline) {
    return (
      <div
        role="alert"
        className={cn(
          "flex items-center gap-3 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3",
          className,
        )}
      >
        <AlertTriangle className="size-4 text-danger shrink-0" />
        <p className="text-[13px] text-foreground flex-1">{title}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            aria-label="Retry"
            className="text-foreground-muted hover:text-foreground transition-colors"
          >
            <RefreshCw className="size-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center py-20 px-6 text-center",
        className,
      )}
    >
      <div className="mb-4 flex items-center justify-center w-16 h-16 rounded-2xl bg-danger/10">
        <AlertTriangle className="size-8 text-danger" />
      </div>
      <h3 className="text-[16px] font-bold text-foreground tracking-tight">{title}</h3>
      <p className="mt-2 text-[13px] text-foreground-muted max-w-xs leading-relaxed">
        {description}
      </p>
      {onRetry && (
        <div className="mt-6">
          <Button variant="outline" iconLeft={<RefreshCw className="size-4" />} onClick={onRetry}>
            Try again
          </Button>
        </div>
      )}
    </div>
  );
}
