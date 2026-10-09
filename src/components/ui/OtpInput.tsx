"use client";

/**
 * OtpInput — always renders exactly 4 digit boxes.
 * No dynamic length, no server dependency. 4-digit OTP is the fixed contract.
 */

import { useRef } from "react";
import { cn } from "@/lib/utils";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
  autoFocus?: boolean;
  // length kept for API compatibility but always treated as 4
  length?: number;
}

const BOXES = [0, 1, 2, 3] as const;

export function OtpInput({ value, onChange, disabled, error, autoFocus }: OtpInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([null, null, null, null]);

  // Always 4 boxes, pad/trim value to 4 chars
  const d0 = value[0] ?? "";
  const d1 = value[1] ?? "";
  const d2 = value[2] ?? "";
  const d3 = value[3] ?? "";
  const digits = [d0, d1, d2, d3];

  function focusBox(i: number) {
    refs.current[Math.max(0, Math.min(3, i))]?.focus();
  }

  function handleChange(i: number, raw: string) {
    const digit = raw.replace(/\D/g, "").slice(-1);
    const next = [d0, d1, d2, d3];
    next[i] = digit;
    onChange(next.join(""));
    if (digit && i < 3) focusBox(i + 1);
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (digits[i]) {
        const next = [d0, d1, d2, d3];
        next[i] = "";
        onChange(next.join(""));
      } else if (i > 0) {
        const next = [d0, d1, d2, d3];
        next[i - 1] = "";
        onChange(next.join(""));
        focusBox(i - 1);
      }
    }
    if (e.key === "ArrowLeft" && i > 0) { e.preventDefault(); focusBox(i - 1); }
    if (e.key === "ArrowRight" && i < 3) { e.preventDefault(); focusBox(i + 1); }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4).padEnd(4, "");
    onChange(pasted);
    focusBox(Math.min(pasted.replace(/\s/g, "").length, 3));
  }

  return (
    <div
      role="group"
      aria-label="4-digit verification code"
      className="flex items-center justify-center gap-3"
    >
      {BOXES.map((i) => {
        const digit = digits[i];
        const filled = digit !== "";
        return (
          <input
            key={i}
            ref={(el) => { refs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            maxLength={2}
            value={digit}
            disabled={disabled}
            autoFocus={autoFocus && i === 0}
            aria-label={`Digit ${i + 1} of 4`}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onFocus={(e) => e.target.select()}
            onPaste={handlePaste}
            className={cn(
              // Size — comfortable touch target, slightly smaller on mobile
              "w-12 h-14 sm:w-14 sm:h-16",
              // Typography
              "text-2xl font-bold font-mono text-center",
              // Shape
              "rounded-xl border-2",
              // Transitions
              "transition-all duration-150",
              // Focus ring
              "focus:outline-none focus:ring-0",
              // States
              error
                ? "border-danger bg-danger/5 text-danger focus:border-danger"
                : filled
                  ? "border-border-strong bg-surface-elevated text-foreground shadow-sm"
                  : "border-border bg-muted text-foreground focus:border-border-strong focus:bg-surface-elevated focus:shadow-sm",
              disabled && "opacity-40 cursor-not-allowed",
            )}
          />
        );
      })}
    </div>
  );
}
