import { Badge } from "@/components/ui/Badge";

/**
 * Maps backend OrderStatus enum values to display config.
 * Exact enum: PendingPayment | PaymentProcessing | Confirmed | Processing |
 *             Packed | Shipped | Delivered | Cancelled | Failed | RefundPending | Refunded
 */
const STATUS_MAP: Record<string, { variant: "success" | "warning" | "danger" | "muted" | "secondary"; label: string }> = {
  pendingpayment:    { variant: "warning",   label: "Pending Payment" },
  paymentprocessing: { variant: "warning",   label: "Processing Payment" },
  confirmed:         { variant: "secondary", label: "Confirmed" },
  processing:        { variant: "secondary", label: "Processing" },
  packed:            { variant: "secondary", label: "Packed" },
  shipped:           { variant: "secondary", label: "Shipped" },
  delivered:         { variant: "success",   label: "Delivered" },
  cancelled:         { variant: "danger",    label: "Cancelled" },
  failed:            { variant: "danger",    label: "Failed" },
  refundpending:     { variant: "warning",   label: "Refund Pending" },
  refunded:          { variant: "muted",     label: "Refunded" },
};

export function OrderStatusBadge({ status }: { status?: string }) {
  const key = (status ?? "").toLowerCase();
  const config = STATUS_MAP[key] ?? { variant: "muted" as const, label: status ?? "Unknown" };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

const PAYMENT_MAP: Record<string, { variant: "success" | "warning" | "danger" | "muted"; label: string }> = {
  paid:          { variant: "success", label: "Paid" },
  authorized:    { variant: "warning", label: "Authorized" },
  pending:       { variant: "warning", label: "Pending" },
  failed:        { variant: "danger",  label: "Failed" },
  refundpending: { variant: "warning", label: "Refund Pending" },
  refunded:      { variant: "muted",   label: "Refunded" },
};

export function PaymentStatusBadge({ method }: { method?: string }) {
  const key = (method ?? "").toLowerCase();
  const config = PAYMENT_MAP[key] ?? { variant: "muted" as const, label: method ?? "—" };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
