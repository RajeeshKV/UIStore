"use client";

import { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  /** Icon shown on the left side */
  iconLeft?: React.ReactNode;
  /** Icon or element shown on the right side */
  iconRight?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, iconLeft, iconRight, className, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const hintId = `${inputId}-hint`;
    const errorId = `${inputId}-error`;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-label text-foreground"
          >
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
            aria-describedby={
              [hint && hintId, error && errorId].filter(Boolean).join(" ") ||
              undefined
            }
            aria-invalid={!!error}
            className={cn(
              "w-full rounded-md border border-border bg-surface-elevated",
              "px-3 py-2 text-body text-foreground",
              "placeholder:text-foreground-muted",
              "transition-colors duration-150",
              "focus:outline-none focus:border-foreground",
              "disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-muted",
              error && "border-danger focus:border-danger",
              iconLeft != null && "pl-9",
              iconRight != null && "pr-9",
              className,
            )}
            {...props}
          />

          {iconRight && (
            <span className="absolute right-3 text-foreground-muted">
              {iconRight}
            </span>
          )}
        </div>

        {hint && !error && (
          <p id={hintId} className="text-caption text-foreground-muted">
            {hint}
          </p>
        )}
        {error && (
          <p id={errorId} className="text-caption text-danger" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";
