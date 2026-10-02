"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { adminOrdersApi } from "@/services/api/admin";
import { AdminPageHeader } from "@/features/admin/AdminPageHeader";
import { AdminTable, type Column } from "@/features/admin/AdminTable";
import { AdminStatusBadge } from "@/features/admin/AdminStatusBadge";
import { Pagination } from "@/components/ui/Pagination";
import { formatPrice , extractApiError } from "@/lib/utils";
import type { OrderSummaryResponse } from "@/types/api";

const PAGE_SIZE = 20;

const ORDER_STATUSES = ["", "PendingPayment", "PaymentProcessing", "Confirmed", "Processing", "Packed", "Shipped", "Delivered", "Cancelled", "Failed", "RefundPending", "Refunded"];

export function AdminOrdersClient() {
  const [orders, setOrders] = useState<OrderSummaryResponse[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await adminOrdersApi.list({
      page,
      pageSize: PAGE_SIZE,
      search: debouncedSearch || undefined,
      status: status || undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
    });
    if (res.ok) {
      setOrders(res.data.items);
      setTotalPages(res.data.totalPages);
      setTotalCount(res.data.totalCount);
    } else {
      setError(extractApiError(res.error, "Failed to load orders."));
    }
    setLoading(false);
  }, [page, debouncedSearch, status, fromDate, toDate]);

  useEffect(() => { void load(); }, [load]);

  const columns: Column<OrderSummaryResponse>[] = [
    {
      key: "order",
      header: "Order",
      render: (row) => (
        <div>
          <Link href={`/admin/orders/${row.id}`} className="text-body-sm font-medium text-foreground hover:underline">
            #{row.orderNumber ?? row.id.slice(0, 8).toUpperCase()}
          </Link>
          <p className="text-caption text-foreground-muted">
            {new Date(row.createdAtUtc).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        </div>
      ),
    },
    {
      key: "total",
      header: "Total",
      render: (row) => (
        <span className="text-body-sm font-semibold text-foreground whitespace-nowrap">
          {formatPrice(row.grandTotal, row.currency ?? "INR")}
        </span>
      ),
    },
    {
      key: "items",
      header: "Items",
      render: (row) => (
        <span className="text-body-sm text-foreground-muted">{row.itemCount}</span>
      ),
    },
    {
      key: "payment",
      header: "Payment",
      render: (row) => (
        <span className="text-body-sm text-foreground-muted capitalize">
          {row.paymentMethod ?? "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <AdminStatusBadge status={row.status ?? "pending"} />,
    },
    {
      key: "actions",
      header: "",
      className: "w-16",
      render: (row) => (
        <Link
          href={`/admin/orders/${row.id}`}
          className="text-body-sm text-foreground-muted hover:text-foreground transition-colors"
        >
          View
        </Link>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Orders"
        description={`${totalCount} order${totalCount !== 1 ? "s" : ""}`}
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-foreground-muted pointer-events-none" />
          <input
            type="search"
            placeholder="Search order number…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search orders"
            className="h-9 pl-9 pr-3 w-52 rounded-md border border-border bg-background text-body-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-focus"
          />
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          aria-label="Filter by order status"
          className="h-9 px-3 rounded-md border border-border bg-background text-body-sm text-foreground focus:outline-none focus:ring-2 focus:ring-focus"
        >
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>{s || "All statuses"}</option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <label htmlFor="order-from" className="text-body-sm text-foreground-muted whitespace-nowrap">From</label>
          <input
            id="order-from"
            type="date"
            value={fromDate}
            onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
            aria-label="From date"
            className="h-9 px-3 rounded-md border border-border bg-background text-body-sm text-foreground focus:outline-none focus:ring-2 focus:ring-focus"
          />
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="order-to" className="text-body-sm text-foreground-muted whitespace-nowrap">To</label>
          <input
            id="order-to"
            type="date"
            value={toDate}
            onChange={(e) => { setToDate(e.target.value); setPage(1); }}
            aria-label="To date"
            className="h-9 px-3 rounded-md border border-border bg-background text-body-sm text-foreground focus:outline-none focus:ring-2 focus:ring-focus"
          />
        </div>
      </div>

      <AdminTable
        columns={columns}
        rows={orders}
        rowKey={(r) => r.id}
        loading={loading}
        error={error}
        emptyTitle="No orders"
        emptyDescription="Orders will appear here once customers place them."
        onRetry={load}
      />

      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      )}
    </div>
  );
}
