import { cn } from "@/lib/utils";

type BadgeVariant =
  | "default"
  | "secondary"
  | "outline"
  | "success"
  | "warning"
  | "danger"
  | "muted";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  default:   "bg-primary text-primary-foreground",
  secondary: "bg-secondary text-secondary-foreground border border-border",
  outline:   "bg-transparent text-foreground border border-border",
  success:   "bg-success/10 text-success border border-success/20",
  warning:   "bg-warning/10 text-warning border border-warning/20",
  danger:    "bg-danger/10 text-danger border border-danger/20",
  muted:     "bg-muted text-muted-foreground",
};

export function Badge({
  variant = "default",
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded px-2 py-0.5",
        "text-caption font-medium leading-none",
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
