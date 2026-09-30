"use client";

import { cn } from "@/lib/utils";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  hint?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
}

/**
 * Pill-style toggle switch. Replaces <input type="checkbox"> across admin UI.
 * Renders an accessible <button role="switch"> so it works without a wrapping <label>.
 */
export function Toggle({ checked, onChange, label, hint, disabled, id, name }: ToggleProps) {
  return (
    <div className={cn("flex items-center justify-between gap-4", disabled && "opacity-50 pointer-events-none")}>
      {(label || hint) && (
        <div className="flex flex-col min-w-0">
          {label && (
            <span
              id={id ? `${id}-label` : undefined}
              className="text-body-sm font-medium text-foreground leading-tight"
            >
              {label}
            </span>
          )}
          {hint && (
            <span className="text-caption text-foreground-muted mt-0.5 leading-snug">{hint}</span>
          )}
        </div>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={id ? `${id}-label` : undefined}
        id={id}
        name={name}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent",
          "transition-colors duration-150 ease-in-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2",
          checked ? "bg-foreground" : "bg-border",
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none inline-block h-4 w-4 rounded-full bg-background shadow-sm",
            "transform transition-transform duration-150 ease-in-out",
            checked ? "translate-x-4" : "translate-x-0",
          )}
        />
      </button>
    </div>
  );
}
