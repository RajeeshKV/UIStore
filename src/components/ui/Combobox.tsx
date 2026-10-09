"use client";

/**
 * Combobox — accessible searchable dropdown that matches the project's Input / Select design.
 *
 * Replaces MUI Autocomplete. Supports:
 * - Free-form filtering by label
 * - Keyboard navigation (↑ ↓ Enter Escape Home End)
 * - Loading / error / empty states
 * - clearable: shows × button when a value is selected
 * - Restricted mode (only API values allowed) vs free-form fallback
 */

import { useState, useRef, useId, useEffect, useCallback } from "react";
import { ChevronDown, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  /** Show a spinner inside the field while this is true */
  loading?: boolean;
  /** Message shown below the field in the error style */
  error?: string;
  /** Message shown below the field in the hint style */
  hint?: string;
  /** Custom message when no options match the search */
  emptyLabel?: string;
  /** When true the selected value is cleared when the user clears the input */
  clearable?: boolean;
  className?: string;
  id?: string;
  autoComplete?: string;
}

export function Combobox({
  options,
  value,
  onChange,
  label,
  placeholder = "Search…",
  required,
  disabled,
  loading,
  error,
  hint,
  emptyLabel = "No options found.",
  clearable = true,
  className,
  id,
  autoComplete = "off",
}: ComboboxProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const listId = `${inputId}-list`;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;

  // The text shown in the input box
  const [inputText, setInputText] = useState(() => {
    const match = options.find((o) => o.value === value);
    return match ? match.label : value;
  });
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Sync inputText when external `value` changes (e.g. PIN auto-populate)
  useEffect(() => {
    const match = options.find((o) => o.value === value);
    setInputText(match ? match.label : value);
  }, [value, options]);

  // Filtered options based on current inputText
  const filtered =
    open && inputText.trim()
      ? options.filter((o) =>
          o.label.toLowerCase().includes(inputText.trim().toLowerCase()),
        )
      : options;

  // Close on outside click
  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        commitOrRevert();
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  });

  // Scroll active item into view
  useEffect(() => {
    if (!open || activeIndex < 0) return;
    const item = listRef.current?.children[activeIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  /** If the input text matches an option, commit; otherwise keep previous value */
  const commitOrRevert = useCallback(() => {
    const match = options.find(
      (o) => o.label.toLowerCase() === inputText.trim().toLowerCase(),
    );
    if (match) {
      onChange(match.value);
      setInputText(match.label);
    } else if (!inputText.trim()) {
      onChange("");
      setInputText("");
    } else {
      // Revert to the previously committed value
      const prev = options.find((o) => o.value === value);
      setInputText(prev ? prev.label : "");
    }
  }, [options, inputText, onChange, value]);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInputText(e.target.value);
    setActiveIndex(-1);
    setOpen(true);
    // Clear committed value when user starts typing something different
    if (!e.target.value.trim()) {
      onChange("");
    }
  }

  function handleFocus() {
    setOpen(true);
    setActiveIndex(-1);
  }

  function selectOption(opt: ComboboxOption) {
    onChange(opt.value);
    setInputText(opt.label);
    setOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true);
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        break;
      case "Home":
        e.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        e.preventDefault();
        setActiveIndex(filtered.length - 1);
        break;
      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0 && filtered[activeIndex]) {
          selectOption(filtered[activeIndex]);
        } else {
          commitOrRevert();
          setOpen(false);
        }
        break;
      case "Escape":
        e.preventDefault();
        commitOrRevert();
        setOpen(false);
        break;
      case "Tab":
        commitOrRevert();
        setOpen(false);
        break;
    }
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange("");
    setInputText("");
    setOpen(true);
    inputRef.current?.focus();
  }

  const selectedLabel = options.find((o) => o.value === value)?.label;
  const showClear = clearable && !disabled && !loading && (value || inputText);
  const descBy = [hint && hintId, error && errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div ref={containerRef} className={cn("flex flex-col gap-1.5 relative", className)}>
      {label && (
        <label htmlFor={inputId} className="text-[13px] font-semibold text-foreground">
          {label}
          {required && (
            <span className="ml-1 text-danger" aria-hidden="true">*</span>
          )}
        </label>
      )}

      {/* Input row */}
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          id={inputId}
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-autocomplete="list"
          aria-controls={listId}
          aria-activedescendant={activeIndex >= 0 ? `${listId}-opt-${activeIndex}` : undefined}
          aria-describedby={descBy}
          aria-invalid={!!error}
          aria-required={required}
          autoComplete={autoComplete}
          disabled={disabled || loading}
          value={inputText}
          placeholder={loading ? "Loading states…" : placeholder}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          className={cn(
            "w-full rounded-md border border-border bg-surface-container",
            "h-11 pl-3 pr-9 text-[14px] text-foreground",
            "placeholder:text-foreground-muted",
            "transition-colors duration-150",
            "focus:outline-none focus:bg-surface-elevated focus:border-primary/40 focus:ring-1 focus:ring-primary/10",
            "disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-muted",
            error && "border-danger focus:border-danger focus:ring-danger/10",
            showClear && "pr-16",
          )}
        />

        {/* Right-side icons: loading spinner → clear button → chevron */}
        <span className="absolute right-3 flex items-center gap-1 pointer-events-none">
          {loading && (
            <Loader2 className="size-4 text-foreground-muted animate-spin" aria-hidden="true" />
          )}
          {!loading && showClear && (
            <button
              type="button"
              aria-label="Clear selection"
              onPointerDown={handleClear}
              className="pointer-events-auto p-0.5 rounded text-foreground-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-focus"
            >
              <X className="size-3.5" />
            </button>
          )}
          {!loading && (
            <ChevronDown
              className={cn(
                "size-4 text-foreground-muted transition-transform duration-150",
                open && "rotate-180",
              )}
              aria-hidden="true"
            />
          )}
        </span>
      </div>

      {/* Dropdown */}
      {open && !loading && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label={label ?? placeholder}
          aria-multiselectable={false}
          className={cn(
            "absolute z-50 top-full mt-1 w-full",
            "rounded-md border border-border bg-surface-elevated shadow-lg",
            "max-h-60 overflow-y-auto",
            // Ensure it sits above surrounding content
            "left-0",
          )}
          // Prevent input blur when clicking a list item
          onPointerDown={(e) => e.preventDefault()}
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2.5 text-[13px] text-foreground-muted select-none">
              {emptyLabel}
            </li>
          ) : (
            filtered.map((opt, idx) => {
              const isActive = idx === activeIndex;
              const isSelected = opt.value === value;
              return (
                <li
                  key={opt.value}
                  id={`${listId}-opt-${idx}`}
                  role="option"
                  aria-selected={isSelected}
                  onPointerDown={() => selectOption(opt)}
                  className={cn(
                    "px-3 py-2 text-[14px] cursor-pointer select-none transition-colors",
                    isActive
                      ? "bg-surface-container text-foreground"
                      : isSelected
                      ? "bg-surface-container/60 text-foreground font-medium"
                      : "text-foreground hover:bg-surface-container",
                  )}
                >
                  {opt.label}
                  {isSelected && (
                    <span className="float-right text-[11px] font-bold text-foreground-muted">
                      ✓
                    </span>
                  )}
                </li>
              );
            })
          )}
        </ul>
      )}

      {/* Currently selected label (for screen readers when input shows typed text) */}
      {selectedLabel && selectedLabel !== inputText && (
        <p className="sr-only" aria-live="polite">
          Selected: {selectedLabel}
        </p>
      )}

      {hint && !error && (
        <p id={hintId} className="text-[12px] text-foreground-muted">{hint}</p>
      )}
      {error && (
        <p id={errorId} className="text-[12px] text-danger" role="alert">{error}</p>
      )}
    </div>
  );
}
