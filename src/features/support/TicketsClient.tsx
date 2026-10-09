"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, MessageCircle, RefreshCw, Clock, ExternalLink } from "lucide-react";
import { ticketsApi } from "@/services/api/support";
import { ordersApi } from "@/services/api/orders";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { Modal } from "@/components/ui/Modal";
import { Pagination } from "@/components/ui/Pagination";
import { TicketStatusBadge } from "./TicketStatusBadge";
import { cn, extractApiError } from "@/lib/utils";
import type { TicketSummaryResponse, TicketStatus, OrderSummaryResponse } from "@/types/api";

const PAGE_SIZE = 10;

// ── Relative time helper ──────────────────────────────────────────────────

function relativeTime(utc: string): string {
  const diff = Date.now() - new Date(utc).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

// Countdown to auto-close for Resolved tickets
function autoCloseCountdown(utc: string): string {
  const ms = new Date(utc).getTime() - Date.now();
  if (ms <= 0) return "closing soon";
  const hrs = Math.floor(ms / 3600000);
  if (hrs < 24) return `closes in ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `closes in ${days} day${days > 1 ? "s" : ""}`;
}

// ── New ticket form ───────────────────────────────────────────────────────

interface NewTicketFormProps {
  orders: OrderSummaryResponse[];
  onCreated: (ticket: TicketSummaryResponse) => void;
  onClose: () => void;
}

function NewTicketForm({ orders, onCreated, onClose }: NewTicketFormProps) {
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [orderId, setOrderId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (subject.trim().length < 4) e.subject = "Subject must be at least 4 characters.";
    if (subject.trim().length > 200) e.subject = "Subject must be 200 characters or fewer.";
    if (description.trim().length < 4) e.description = "Description must be at least 4 characters.";
    if (description.trim().length > 8000) e.description = "Description must be 8000 characters or fewer.";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({}); setError(""); setSaving(true);
    const res = await ticketsApi.create({
      subject: subject.trim(),
      description: description.trim(),
      orderId: orderId || null,
    });
    setSaving(false);
    if (res.ok) {
      onCreated(res.data);
    } else {
      setError(extractApiError(res.error, "Failed to create ticket."));
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {error && (
        <p role="alert" className="text-body-sm text-danger bg-danger/5 border border-danger/20 rounded-md px-4 py-2">{error}</p>
      )}

      <Input
        label="Subject"
        required
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        placeholder="e.g. My order never arrived"
        maxLength={200}
        error={errors.subject}
        hint={subject.length > 150 ? `${subject.length}/200` : undefined}
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-body-sm font-medium text-foreground">
          Description <span className="text-danger" aria-hidden="true">*</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          maxLength={8000}
          placeholder="Describe your issue in detail…"
          aria-label="Description"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-body-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-focus resize-none"
        />
        {errors.description && <p className="text-caption text-danger">{errors.description}</p>}
        {description.length > 7000 && (
          <p className="text-caption text-foreground-muted">{description.length}/8000</p>
        )}
      </div>

      {orders.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <label className="text-body-sm font-medium text-foreground">Related order (optional)</label>
          <select
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            aria-label="Related order"
            className="h-9 px-3 rounded-md border border-border bg-background text-body-sm text-foreground focus:outline-none focus:ring-2 focus:ring-focus"
          >
            <option value="">— No specific order —</option>
            {orders.map((o) => (
              <option key={o.id} value={o.id}>
                {o.orderNumber ?? o.id.slice(0, 8).toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-1 border-t border-border">
        <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button type="submit" variant="primary" size="sm" loading={saving}>Submit Request</Button>
      </div>
    </form>
  );
}

// ── Main client ───────────────────────────────────────────────────────────

export function TicketsClient() {
  const [tickets, setTickets] = useState<TicketSummaryResponse[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "">("");
  const [newOpen, setNewOpen] = useState(false);
  const [orders, setOrders] = useState<OrderSummaryResponse[]>([]);

  const load = useCallback(async (p: number) => {
    setLoading(true); setError(false);
    const res = await ticketsApi.list({
      status: statusFilter || undefined,
      page: p,
      pageSize: PAGE_SIZE,
    });
    if (res.ok) {
      setTickets(res.data.items);
      setTotalPages(Math.max(1, res.data.totalPages));
    } else {
      setError(true);
    }
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { void load(page); }, [load, page]);

  // Load orders for the new ticket form order picker
  useEffect(() => {
    ordersApi.list(1, 50).then((r) => { if (r.ok) setOrders(r.data.items ?? []); });
  }, []);

  function handleCreated(ticket: TicketSummaryResponse) {
    setNewOpen(false);
    setTickets((prev) => [ticket, ...prev]);
  }

  const ticketRows = loading
    ? Array.from({ length: 4 })
    : tickets;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[18px] font-bold text-foreground">Support Requests</h1>
          <p className="text-[13px] text-foreground-muted mt-0.5">Open a ticket to get help from our team.</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setNewOpen(true)} iconLeft={<Plus className="size-3.5" />}>
          New Request
        </Button>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(["", "Open", "Resolved", "Closed"] as const).map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s as TicketStatus | ""); setPage(1); }}
            className={cn(
              "h-8 px-3.5 rounded-full text-[12px] font-semibold border transition-all",
              statusFilter === s
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-foreground-muted hover:border-primary hover:text-foreground",
            )}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      {/* List */}
      {error ? (
        <div className="text-center py-10">
          <p className="text-body-sm text-foreground-muted mb-3">Failed to load support requests.</p>
          <Button variant="outline" size="sm" onClick={() => load(page)} iconLeft={<RefreshCw className="size-3.5" />}>Retry</Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))
          ) : tickets.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
                <MessageCircle className="size-7 text-border" />
              </div>
              <div>
                <p className="text-[15px] font-bold text-foreground">No support requests</p>
                <p className="text-[13px] text-foreground-muted mt-1">
                  {statusFilter ? `No ${statusFilter.toLowerCase()} requests.` : "Get help by opening a new request."}
                </p>
              </div>
              <Button variant="primary" size="sm" onClick={() => setNewOpen(true)}>Open a Request</Button>
            </div>
          ) : (
            tickets.map((t) => (
              <Link
                key={t.id}
                href={`/account/support/${t.id}`}
                className="group rounded-2xl border border-border bg-surface-elevated p-4 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all flex flex-col gap-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-foreground leading-snug line-clamp-1 group-hover:text-foreground">
                      {t.subject}
                    </p>
                    <p className="text-[11px] text-foreground-muted mt-0.5 font-mono">{t.ticketNumber}</p>
                  </div>
                  <TicketStatusBadge status={t.status} />
                </div>
                <div className="flex items-center gap-3 flex-wrap text-[11px] text-foreground-muted">
                  {t.orderNumber && (
                    <span className="flex items-center gap-1">
                      <ExternalLink className="size-3" />
                      Order {t.orderNumber}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <MessageCircle className="size-3" />
                    {t.commentCount} message{t.commentCount !== 1 ? "s" : ""}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="size-3" />
                    {relativeTime(t.lastActivityAtUtc)}
                  </span>
                  {t.status === "Resolved" && t.autoCloseAtUtc && (
                    <span className="text-warning font-medium">{autoCloseCountdown(t.autoCloseAtUtc)}</span>
                  )}
                  {t.status === "Open" && t.awaitingFirstResponse && (
                    <span className="text-blue-600 font-medium">Awaiting response</span>
                  )}
                </div>
              </Link>
            ))
          )}
        </div>
      )}

      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} onPageChange={(p) => { setPage(p); void load(p); }} />
      )}

      {/* New ticket modal */}
      <Modal open={newOpen} onClose={() => setNewOpen(false)} title="New Support Request" size="max-w-lg">
        <NewTicketForm orders={orders} onCreated={handleCreated} onClose={() => setNewOpen(false)} />
      </Modal>
    </div>
  );
}
