import { cn } from "@/lib/utils";
import { Button } from "./Button";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  className?: string;
  /** Compact version with reduced padding */
  compact?: boolean;
}

export function EmptyState({ icon, title, description, action, className, compact = false }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "py-10 px-4" : "py-20 px-6",
        className,
      )}
    >
      {icon && (
        <div className={cn(
          "mb-4 flex items-center justify-center rounded-2xl bg-surface-container text-foreground-muted",
          compact ? "w-12 h-12" : "w-16 h-16",
        )}>
          {icon}
        </div>
      )}
      <h3 className="text-[16px] font-bold text-foreground tracking-tight">{title}</h3>
      {description && (
        <p className="mt-2 text-[13px] text-foreground-muted max-w-xs leading-relaxed">
          {description}
        </p>
      )}
      {action && (
        <div className="mt-6">
          {action.href ? (
            <a href={action.href}>
              <Button variant="primary">{action.label}</Button>
            </a>
          ) : (
            <Button variant="primary" onClick={action.onClick}>
              {action.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
