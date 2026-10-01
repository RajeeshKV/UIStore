"use client";

import { useRef, useId } from "react";
import { cn } from "@/lib/utils";

interface OtpInputProps {
  length: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
  autoFocus?: boolean;
}

/**
 * OTP digit input — renders `length` individual digit boxes.
 *
 * - autocomplete="one-time-code" on first box for iOS/Android SMS autofill.
 * - inputmode="numeric" for mobile keyboard.
 * - Supports paste (pastes into boxes starting at cursor position, or replaces all).
 * - Digits only — strips non-digit characters on input.
 * - Left-to-right auto-advance on each digit entry.
 * - Backspace on empty box moves focus to previous.
 */
export function OtpInput({ length, value, onChange, disabled, error, autoFocus }: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const groupId = useId();

  // Ensure digits array is always exactly `length` long
  const digits = value.padEnd(length, "").slice(0, length).split("");

  function focusBox(index: number) {
    inputRefs.current[Math.max(0, Math.min(length - 1, index))]?.focus();
  }

  function handleChange(index: number, e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, "");

    if (raw.length > 1) {
      // Paste / multiple chars — fill from this box onwards
      const next = (value.slice(0, index) + raw).slice(0, length);
      onChange(next.padEnd(length, "").slice(0, length));
      const nextFocus = Math.min(index + raw.length, length - 1);
      setTimeout(() => focusBox(nextFocus), 0);
      return;
    }

    const next = digits.map((d, i) => (i === index ? raw : d)).join("");
    onChange(next);

    if (raw && index < length - 1) {
      focusBox(index + 1);
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      if (digits[index]) {
        // Clear current box
        const next = digits.map((d, i) => (i === index ? "" : d)).join("");
        onChange(next);
      } else if (index > 0) {
        // Move to previous and clear it
        const next = digits.map((d, i) => (i === index - 1 ? "" : d)).join("");
        onChange(next);
        focusBox(index - 1);
      }
      e.preventDefault();
      return;
    }

    if (e.key === "ArrowLeft" && index > 0) {
      focusBox(index - 1);
      e.preventDefault();
      return;
    }
    if (e.key === "ArrowRight" && index < length - 1) {
      focusBox(index + 1);
      e.preventDefault();
      return;
    }

    // Block non-digit, non-control keys
    const allowed = ["Tab", "Escape", "Enter", "Home", "End"];
    const isDigit = /^\d$/.test(e.key);
    const isCtrl = e.ctrlKey || e.metaKey;
    if (!allowed.includes(e.key) && !isDigit && !isCtrl) {
      e.preventDefault();
    }
  }

  function handleFocus(index: number) {
    // On focus, select the current box content so re-typing replaces it
    inputRefs.current[index]?.select();
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    onChange(pasted.padEnd(length, "").slice(0, length));
    setTimeout(() => focusBox(Math.min(pasted.length, length - 1)), 0);
  }

  return (
    <div
      role="group"
      aria-label="One-time code"
      className="flex items-center gap-2"
    >
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => { inputRefs.current[index] = el; }}
          id={index === 0 ? `${groupId}-0` : undefined}
          type="text"
          inputMode="numeric"
          // autocomplete on first box triggers iOS/Android SMS suggestion
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={1}
          value={digit}
          disabled={disabled}
          autoFocus={autoFocus && index === 0}
          aria-label={`Digit ${index + 1} of ${length}`}
          onChange={(e) => handleChange(index, e)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onFocus={() => handleFocus(index)}
          onPaste={handlePaste}
          className={cn(
            "h-12 w-11 rounded-lg border text-center font-mono text-h4 font-semibold",
            "bg-surface-elevated text-foreground",
            "focus:outline-none focus:ring-2 focus:ring-focus transition-colors duration-150",
            error
              ? "border-danger focus:ring-danger/30 text-danger"
              : digit
                ? "border-primary bg-primary/5 text-primary"
                : "border-border",
            disabled && "opacity-50 cursor-not-allowed",
          )}
        />
      ))}
    </div>
  );
}
