"use client";

import { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";
import { normalisePhone } from "@/services/api/otp";

interface PhoneInputProps {
  label?: string;
  value: string;
  onChange: (national: string) => void;
  error?: string;
  hint?: string;
  disabled?: boolean;
  /** When true shows a "Change" button instead of allowing direct edit */
  locked?: boolean;
  onUnlock?: () => void;
  required?: boolean;
  autoFocus?: boolean;
}

/**
 * Fixed +91 prefix Indian phone input.
 * - Accepts only digits (strips everything else on input).
 * - Formats as "XXXXX XXXXX" visually while storing raw 10-digit national number.
 * - autocomplete="tel" for browser autofill.
 * - inputmode="numeric" for mobile numeric keyboard.
 * - Mirrors the backend's SmsPhoneNumber.TryToNational constraint: 10 digits, first 6-9.
 */
export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  function PhoneInput(
    { label, value, onChange, error, hint, disabled, locked, onUnlock, required, autoFocus },
    ref,
  ) {
    const id = useId();
    const hintId = `${id}-hint`;
    const errorId = `${id}-error`;

    // Visual display: format as "XXXXX XXXXX" (no spaces stored in value)
    const display = value.replace(/(\d{5})(\d{0,5})/, "$1 $2").trim();

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
      const raw = normalisePhone(e.target.value);
      // Only allow up to 10 digits
      onChange(raw.slice(0, 10));
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
      // Allow control keys, digits only
      const allowed = [
        "Backspace", "Delete", "Tab", "Escape", "Enter",
        "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End",
      ];
      const isDigit = /^\d$/.test(e.key);
      const isCtrl = e.ctrlKey || e.metaKey;
      if (!allowed.includes(e.key) && !isDigit && !isCtrl) {
        e.preventDefault();
      }
    }

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-label text-foreground">
            {label}
            {required && <span className="ml-1 text-danger" aria-hidden="true">*</span>}
          </label>
        )}

        <div className="flex items-center gap-0">
          {/* Fixed +91 prefix */}
          <span
            className={cn(
              "flex h-10 items-center justify-center rounded-l-md border border-r-0 border-border bg-muted",
              "px-3 text-body text-foreground-muted font-mono select-none shrink-0",
              disabled || locked ? "opacity-60" : "",
            )}
            aria-hidden="true"
          >
            +91
          </span>

          <input
            ref={ref}
            id={id}
            type="text"
            inputMode="numeric"
            autoComplete="tel"
            value={display}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={disabled || locked}
            readOnly={locked}
            required={required}
            autoFocus={autoFocus}
            placeholder="98765 43210"
            aria-describedby={
              [hint && hintId, error && errorId].filter(Boolean).join(" ") || undefined
            }
            aria-invalid={!!error}
            className={cn(
              "h-10 flex-1 rounded-r-md border border-border bg-surface-elevated",
              "px-3 text-body text-foreground placeholder:text-foreground-muted font-mono",
              "focus:outline-none focus:ring-2 focus:ring-focus transition-colors duration-150",
              error && "border-danger focus:ring-danger/30",
              (disabled || locked) && "opacity-60 bg-muted cursor-not-allowed",
            )}
          />

          {locked && onUnlock && (
            <button
              type="button"
              onClick={onUnlock}
              className="ml-2 shrink-0 text-caption text-primary underline underline-offset-2 hover:no-underline transition-all"
            >
              Change
            </button>
          )}
        </div>

        {error && (
          <p id={errorId} role="alert" className="text-caption text-danger">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={hintId} className="text-caption text-foreground-muted">
            {hint}
          </p>
        )}
      </div>
    );
  },
);
