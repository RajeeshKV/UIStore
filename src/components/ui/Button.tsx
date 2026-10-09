"use client";

import { forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // Base
  [
    "inline-flex items-center justify-center font-semibold whitespace-nowrap select-none",
    "transition-all duration-150",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
    "disabled:cursor-not-allowed disabled:opacity-50",
    "active:scale-[0.98]",
  ],
  {
    variants: {
      variant: {
        /** Obsidian black — primary CTA (Add to Cart, Shop Now, etc.) */
        primary: [
          "bg-primary text-primary-foreground",
          "hover:bg-primary/90",
          "disabled:bg-primary/40",
        ],
        /** White with border — secondary/ghost actions */
        secondary: [
          "bg-surface-elevated text-foreground border border-border",
          "hover:bg-surface hover:border-border-strong",
        ],
        /** Transparent with border */
        outline: [
          "bg-transparent text-foreground border border-border",
          "hover:bg-muted",
        ],
        /** Transparent, no border */
        ghost: [
          "bg-transparent text-foreground",
          "hover:bg-muted",
        ],
        /** Destructive */
        danger: [
          "bg-danger text-danger-foreground",
          "hover:bg-danger/85",
          "disabled:bg-danger/40",
        ],
      },
      size: {
        sm: "h-8 px-3 text-[12px] rounded-md gap-1.5",
        md: "h-10 px-4 text-[13px] rounded-md gap-2",
        lg: "h-11 px-6 text-[14px] rounded-lg gap-2",
        /** Full-rounded pill — matches design's rounded-full CTAs */
        pill: "h-11 px-7 text-[13px] rounded-full gap-2.5",
        icon: "h-9 w-9 rounded-md",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  fullWidth?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  /** Render as a child element (Radix Slot) */
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant,
      size,
      loading = false,
      fullWidth = false,
      iconLeft,
      iconRight,
      asChild = false,
      className,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={cn(
          buttonVariants({ variant, size }),
          fullWidth && "w-full",
          className,
        )}
        {...props}
      >
        {loading ? (
          <>
            <SpinnerIcon className={size === "sm" ? "size-3.5" : "size-4"} />
            <span>{children}</span>
          </>
        ) : (
          <>
            {iconLeft}
            {children}
            {iconRight}
          </>
        )}
      </Comp>
    );
  },
);
Button.displayName = "Button";

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn("animate-spin", className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export { buttonVariants };
