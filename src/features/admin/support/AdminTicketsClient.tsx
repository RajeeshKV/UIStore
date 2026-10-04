"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { adminTicketsApi } from "@/services/api/support";
import { AdminPageHeader } from "@/features/admin/AdminPageHeader";
import { AdminTable, type Column } from "@/features/admin/AdminTable";
import { Pagination } from "@/components/ui/Pagination";
import { TicketStatusBadge, TicketPriorityBadge } from "@/features/support/TicketStatusBadge";
import { extractApiError } from "@/lib/utils";
import type { TicketSummaryResponse, TicketStatus, TicketPriority } from "@/types/api";

const PAGE_SIZE = 20;
const STATUSES: (TicketStatus | "")[] = ["", "Open", "Resolved", "Closed"];
const PRIORITIES: (TicketPriority | "")[] = ["", "Low", "Normal", "High", "Urgent"];

function relativeTime(utc: string) {
  const diff = Date.now() - new Date(utc).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function AdminTicketsClient() {
  const router = useRouter();
  const [tickets, setTickets]       = useState<TicketSummaryResponse[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage]             = useState(1);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  const [search, setSearch]               = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter]   = useState<TicketStatus | "">("");
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | "">("");
  const [unansweredOnly, setUnansweredOnly] = useState(false);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    const res = await adminTicketsApi.list({
      status: statusFilter || undefined,
      priority: priorityFilter || undefined,
      search: debouncedSearch || undefined,
      unansweredOnly: unansweredOnly || undefined,
      page,
      pageSize: PAGE_SIZE,
    });
    if (res.ok) {
      setTickets(res.data.items);
      setTotalPages(Math.max(1, res.data.totalPages));
      setTotalCount(res.data.totalCount);
    } else {
      setError(extractApiError(res.error, "Failed to load support queue."));
    }
    setLoading(false);
  }, [page, debouncedSearch, statusFilter, priorityFilter, unansweredOnly]);

  useEffect(() => { void load(); }, [load]);

  const columns: Column<TicketSummaryResponse>[] = [
    {
      key: "ticket",
      header: "Ticket",
      render: (row) => (
        <div>
          <p className="text-body-sm font-medium text-foreground line-clamp-1">{row.subject}</p>
          <p className="text-caption font-mono text-foreground-muted">{row.ticketNumber}</p>
        </div>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      render: (row) => (
        <div>
          <p className="text-body-sm text-foreground">{row.customerName ?? "—"}</p>
          <p className="text-caption text-foreground-muted">{row.customerEmail ?? ""}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <div className="flex flex-col gap-1">
          <TicketStatusBadge status={row.status} />
          {row.awaitingFirstResponse && row.status === "Open" && (
            <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide">Awaiting reply</span>
          )}
        </div>
      ),
    },
    {
      key: "priority",
      header: "Priority",
      render: (row) => <TicketPriorityBadge priority={row.priority} />,
    },
    {
      key: "order",
      header: "Order",
      render: (row) => (
        <span className="text-body-sm text-foreground-muted">{row.orderNumber ?? "—"}</span>
      ),
    },
    {
      key: "activity",
      header: "Last activity",
      render: (row) => (
        <span className="text-caption text-foreground-muted whitespace-nowrap">
          {relativeTime(row.lastActivityAtUtc)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-16",
      render: (row) => (
        <button
          onClick={(e) => { e.stopPropagation(); router.push(`/admin/support/${row.id}`); }}
          className="text-body-sm text-foreground-muted hover:text-foreground transition-colors"
        >
          Open
        </button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Support Queue"
        description={`${totalCount} ticket${totalCount !== 1 ? "s" : ""}`}
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-foreground-muted pointer-events-none" />
          <input
            type="search"
            placeholder="Search subject or customer…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search tickets"
            className="h-9 pl-9 pr-3 w-56 rounded-md border border-border bg-background text-body-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-focus"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as TicketStatus | ""); setPage(1); }}
          aria-label="Filter by status"
          className="h-9 px-3 rounded-md border border-border bg-background text-body-sm text-foreground focus:outline-none focus:ring-2 focus:ring-focus"
        >
          {STATUSES.map((s) => <option key={s} value={s}>{s || "All statuses"}</option>)}
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => { setPriorityFilter(e.target.value as TicketPriority | ""); setPage(1); }}
          aria-label="Filter by priority"
          className="h-9 px-3 rounded-md border border-border bg-background text-body-sm text-foreground focus:outline-none focus:ring-2 focus:ring-focus"
        >
          {PRIORITIES.map((p) => <option key={p} value={p}>{p || "All priorities"}</option>)}
        </select>
        <label className="flex items-center gap-2 h-9 px-3 rounded-md border border-border bg-background text-body-sm text-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={unansweredOnly}
            onChange={(e) => { setUnansweredOnly(e.target.checked); setPage(1); }}
            className="h-4 w-4 rounded border-border accent-primary"
          />
          Unanswered only
        </label>
      </div>

      <AdminTable
        columns={columns}
        rows={tickets}
        rowKey={(r) => r.id}
        loading={loading}
        error={error}
        emptyTitle="No tickets"
        emptyDescription={unansweredOnly ? "No unanswered tickets." : "Support tickets will appear here."}
        onRetry={load}
        onRowClick={(row) => router.push(`/admin/support/${row.id}`)}
      />

      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      )}
    </div>
  );
}
