import { Badge } from "@/components/ui/Badge";

const STATUS_MAP: Record<string, { variant: "success" | "warning" | "danger" | "muted" | "secondary"; label: string }> = {
  pending:    { variant: "warning",   label: "Pending" },
  confirmed:  { variant: "secondary", label: "Confirmed" },
  processing: { variant: "secondary", label: "Processing" },
  shipped:    { variant: "secondary", label: "Shipped" },
  delivered:  { variant: "success",   label: "Delivered" },
  cancelled:  { variant: "danger",    label: "Cancelled" },
  refunded:   { variant: "muted",     label: "Refunded" },
};

export function OrderStatusBadge({ status }: { status?: string }) {
  const key = (status ?? "").toLowerCase();
  const config = STATUS_MAP[key] ?? { variant: "muted" as const, label: status ?? "Unknown" };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

const PAYMENT_MAP: Record<string, { variant: "success" | "warning" | "danger" | "muted"; label: string }> = {
  paid:     { variant: "success", label: "Paid" },
  pending:  { variant: "warning", label: "Pending" },
  failed:   { variant: "danger",  label: "Failed" },
  refunded: { variant: "muted",   label: "Refunded" },
};

export function PaymentStatusBadge({ method }: { method?: string }) {
  const key = (method ?? "").toLowerCase();
  const config = PAYMENT_MAP[key] ?? { variant: "muted" as const, label: method ?? "—" };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
