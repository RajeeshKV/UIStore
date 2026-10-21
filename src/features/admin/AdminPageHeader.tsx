import { cn } from "@/lib/utils";

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function AdminPageHeader({ title, description, action, className }: AdminPageHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4 mb-6", className)}>
      <div>
        <h2 className="text-[21px] font-bold text-foreground tracking-tight">{title}</h2>
        {description && (
          <p className="mt-1 text-[13px] text-foreground-muted">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
