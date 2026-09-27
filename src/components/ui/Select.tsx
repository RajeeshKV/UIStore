"use client";

import { forwardRef, useId } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, options, placeholder, className, id, ...props }, ref) => {
    const generatedId = useId();
    const selectId = id ?? generatedId;
    const hintId = `${selectId}-hint`;
    const errorId = `${selectId}-error`;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-label text-foreground">
            {label}
            {props.required && (
              <span className="ml-1 text-danger" aria-hidden="true">*</span>
            )}
          </label>
        )}

        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            aria-describedby={
              [hint && hintId, error && errorId].filter(Boolean).join(" ") ||
              undefined
            }
            aria-invalid={!!error}
            className={cn(
              "w-full appearance-none rounded-md border border-border bg-surface-elevated",
              "px-3 py-2 pr-9 text-body text-foreground",
              "transition-colors duration-150",
              "focus:outline-none focus:border-foreground",
              "disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-muted",
              error && "border-danger focus:border-danger",
              className,
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-foreground-muted pointer-events-none"
            aria-hidden="true"
          />
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
Select.displayName = "Select";
