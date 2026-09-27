import { cn } from "@/lib/utils";

type BadgeColor = "green" | "red" | "yellow" | "gray" | "blue";

const COLOR_CLASSES: Record<BadgeColor, string> = {
  green: "bg-success/10 text-success border-success/20",
  red: "bg-danger/10 text-danger border-danger/20",
  yellow: "bg-warning/10 text-warning border-warning/20",
  gray: "bg-muted text-foreground-muted border-border",
  blue: "bg-primary/10 text-primary border-primary/20",
};

function statusColor(status: string): BadgeColor {
  const s = status.toLowerCase();
  if (["active", "published", "paid", "delivered", "completed", "enabled", "configured"].includes(s)) return "green";
  if (["inactive", "archived", "cancelled", "failed", "disabled"].includes(s)) return "red";
  if (["draft", "pending", "processing", "low_stock", "unpublished"].includes(s)) return "yellow";
  if (["shipped", "in_transit"].includes(s)) return "blue";
  return "gray";
}

interface AdminStatusBadgeProps {
  status: string;
  label?: string;
  color?: BadgeColor;
}

export function AdminStatusBadge({ status, label, color }: AdminStatusBadgeProps) {
  const c = color ?? statusColor(status);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-caption font-medium whitespace-nowrap",
        COLOR_CLASSES[c],
      )}
    >
      {label ?? status}
    </span>
  );
}
