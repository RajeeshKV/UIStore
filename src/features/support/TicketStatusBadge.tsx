import { cn } from "@/lib/utils";
import type { TicketStatus, TicketPriority } from "@/types/api";

const STATUS_STYLE: Record<TicketStatus, string> = {
  Open:     "bg-blue-50 text-blue-700 border-blue-200",
  Resolved: "bg-success/10 text-success border-success/20",
  Closed:   "bg-muted text-foreground-muted border-border",
};

const STATUS_DOT: Record<TicketStatus, string> = {
  Open:     "bg-blue-500",
  Resolved: "bg-success",
  Closed:   "bg-foreground-muted",
};

const PRIORITY_STYLE: Record<TicketPriority, string> = {
  Low:    "bg-muted text-foreground-muted border-border",
  Normal: "bg-muted text-foreground-muted border-border",
  High:   "bg-warning/10 text-warning border-warning/20",
  Urgent: "bg-danger/10 text-danger border-danger/20",
};

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
      STATUS_STYLE[status],
    )}>
      <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT[status])} aria-hidden="true" />
      {status}
    </span>
  );
}

export function TicketPriorityBadge({ priority }: { priority: TicketPriority }) {
  return (
    <span className={cn(
      "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
      PRIORITY_STYLE[priority],
    )}>
      {priority}
    </span>
  );
}
