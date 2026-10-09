"use client";

import { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { label, error, hint, iconLeft, iconRight, className, id, type, step, onKeyDown, ...props },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const hintId = `${inputId}-hint`;
    const errorId = `${inputId}-error`;

    const isNumeric = type === "number";
    const allowDecimal = isNumeric && step !== undefined && String(step) !== "1";
    const resolvedType = isNumeric ? "text" : type;
    const inputMode = isNumeric ? (allowDecimal ? "decimal" : "numeric") : undefined;

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
      if (isNumeric) {
        const allowed = [
          "Backspace","Delete","Tab","Escape","Enter",
          "ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Home","End",
        ];
        const isDigit = /^\d$/.test(e.key);
        const isMinus = e.key === "-" && e.currentTarget.selectionStart === 0;
        const isDecimalPoint = allowDecimal && e.key === "." && !e.currentTarget.value.includes(".");
        const isCtrl = e.ctrlKey || e.metaKey;
        if (!allowed.includes(e.key) && !isDigit && !isMinus && !isDecimalPoint && !isCtrl) {
          e.preventDefault();
        }
      }
      onKeyDown?.(e);
    }

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-[13px] font-semibold text-foreground">
            {label}
            {props.required && (
              <span className="ml-1 text-danger" aria-hidden="true">*</span>
            )}
          </label>
        )}

        <div className="relative flex items-center">
          {iconLeft && (
            <span className="absolute left-3 text-foreground-muted pointer-events-none">
              {iconLeft}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            type={resolvedType}
            inputMode={inputMode}
            onKeyDown={handleKeyDown}
            aria-describedby={
              [hint && hintId, error && errorId].filter(Boolean).join(" ") || undefined
            }
            aria-invalid={!!error}
            className={cn(
              "w-full rounded-md border border-border bg-surface-container",
            "h-11 px-3 text-[14px] text-foreground",
            "placeholder:text-foreground-muted",
            "transition-colors duration-150",
            "focus:outline-none focus:bg-surface-elevated focus:border-primary/40 focus:ring-1 focus:ring-primary/10",
              "disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-muted",
              error && "border-danger focus:border-danger focus:ring-danger/10",
              iconLeft != null && "pl-10",
              iconRight != null && "pr-10",
              className,
            )}
            {...props}
          />

          {iconRight && (
            <span className="absolute right-3 text-foreground-muted">{iconRight}</span>
          )}
        </div>

        {hint && !error && (
          <p id={hintId} className="text-[12px] text-foreground-muted">{hint}</p>
        )}
        {error && (
          <p id={errorId} className="text-[12px] text-danger" role="alert">{error}</p>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";
