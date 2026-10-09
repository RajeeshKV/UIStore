import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 font-semibold leading-none",
  {
    variants: {
      variant: {
        /** Default — obsidian pill */
        default:   "bg-primary text-primary-foreground rounded-full px-2.5 py-1 text-[11px]",
        /** Crimson — discount/sale badge matches design secondary */
        discount:  "bg-secondary text-secondary-foreground rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide",
        /** Neutral surface */
        secondary: "bg-surface-container text-foreground-muted rounded-full px-2.5 py-1 text-[11px] border border-border",
        /** Outline only */
        outline:   "bg-transparent text-foreground border border-border rounded-full px-2.5 py-1 text-[11px]",
        /** Success */
        success:   "bg-success/10 text-success border border-success/20 rounded-full px-2.5 py-1 text-[11px]",
        /** Warning */
        warning:   "bg-warning/10 text-warning border border-warning/20 rounded-full px-2.5 py-1 text-[11px]",
        /** Danger */
        danger:    "bg-danger/10 text-danger border border-danger/20 rounded-full px-2.5 py-1 text-[11px]",
        /** Muted */
        muted:     "bg-muted text-foreground-muted rounded-full px-2.5 py-1 text-[11px]",
        /** Status dot — caps style */
        caps:      "bg-surface-container text-foreground-muted rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-widest border border-border",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ variant, className, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {children}
    </span>
  );
}

export { badgeVariants };
