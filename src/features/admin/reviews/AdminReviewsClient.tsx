"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, Star, Check, X, Trash2, Eye } from "lucide-react";
import { adminReviewsApi } from "@/services/api/reviews";
import { AdminPageHeader } from "@/features/admin/AdminPageHeader";
import { AdminTable, type Column } from "@/features/admin/AdminTable";
import { ConfirmDialog } from "@/features/admin/AdminDialog";
import { Pagination } from "@/components/ui/Pagination";
import { Button } from "@/components/ui/Button";
import { cn, extractApiError } from "@/lib/utils";
import type { AdminReviewResponse } from "@/types/api";

const PAGE_SIZE = 20;
const STATUSES = ["", "Pending", "Published", "Rejected"] as const;

// ── Status badge ──────────────────────────────────────────────────────────────

function ReviewStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Pending:   "bg-warning/10 text-warning border-warning/20",
    Published: "bg-success/10 text-success border-success/20",
    Rejected:  "bg-danger/10 text-danger border-danger/20",
  };
  return (
    <span className={cn(
      "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
      map[status] ?? "bg-muted text-foreground-muted border-border",
    )}>
      {status}
    </span>
  );
}

// ── Star display ──────────────────────────────────────────────────────────────

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${rating} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn("size-3", i < rating ? "fill-[#F59E0B] text-[#F59E0B]" : "fill-none text-border")}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

// ── Review detail drawer ──────────────────────────────────────────────────────

interface ReviewDetailProps {
  review: AdminReviewResponse;
  onPublish: () => void;
  onReject: (reason: string) => void;
  onDelete: () => void;
  onClose: () => void;
  loading: boolean;
}

function ReviewDetail({ review, onPublish, onReject, onDelete, onClose, loading }: ReviewDetailProps) {
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  function submitReject() {
    if (!rejectReason.trim()) { setRejectError("A reason is required when rejecting."); return; }
    setRejectError("");
    onReject(rejectReason.trim());
  }

  const date = new Date(review.createdAtUtc).toLocaleDateString("en-IN", {
    year: "numeric", month: "short", day: "numeric",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-xl bg-background rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-border">
          <div>
            <p className="text-body font-semibold text-foreground">Review Detail</p>
            <p className="text-caption text-foreground-muted mt-0.5">
              {review.productName ?? "Product"} · {date}
            </p>
          </div>
          <button onClick={onClose} className="h-7 w-7 flex items-center justify-center rounded-lg text-foreground-muted hover:bg-muted">
            <X className="size-4" />
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
          {/* Customer */}
          <div className="rounded-lg bg-muted px-4 py-3 flex flex-col gap-1">
            <p className="text-caption font-semibold text-foreground-muted uppercase tracking-wide">Customer</p>
            <p className="text-body-sm text-foreground">{review.authorName ?? "—"}</p>
            <p className="text-caption text-foreground-muted font-mono">{review.customerEmail}</p>
            {review.isVerifiedPurchase && (
              <span className="text-[10px] font-bold text-success">✓ Verified Purchase</span>
            )}
          </div>

          {/* Rating + status */}
          <div className="flex items-center gap-3">
            <Stars rating={review.rating} />
            <ReviewStatusBadge status={review.status} />
            {review.publishedAtUtc && (
              <span className="text-caption text-foreground-muted">
                Published {new Date(review.publishedAtUtc).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
              </span>
            )}
          </div>

          {/* Content */}
          {review.title && (
            <p className="text-body font-semibold text-foreground">{review.title}</p>
          )}
          {review.body && (
            <p className="text-body-sm text-foreground-muted leading-relaxed whitespace-pre-wrap">{review.body}</p>
          )}

          {/* Images */}
          {review.images && review.images.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {review.images.map((img) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={img.id} src={img.url} alt="Review" className="h-16 w-16 rounded-lg object-cover border border-border" />
              ))}
            </div>
          )}

          {/* Rejection reason (if rejected) */}
          {review.status === "Rejected" && review.rejectionReason && (
            <div className="rounded-lg bg-danger/5 border border-danger/20 px-4 py-3">
              <p className="text-caption font-semibold text-danger uppercase tracking-wide mb-1">Rejection Reason</p>
              <p className="text-body-sm text-foreground">{review.rejectionReason}</p>
            </div>
          )}

          {/* Reject form */}
          {rejectMode && (
            <div className="flex flex-col gap-2 rounded-lg border border-border p-4 bg-surface">
              <p className="text-body-sm font-semibold text-foreground">Rejection Reason</p>
              {rejectError && <p className="text-caption text-danger">{rejectError}</p>}
              <textarea
                value={rejectReason}
                onChange={(e) => { setRejectReason(e.target.value); setRejectError(""); }}
                rows={3}
                placeholder="Explain why this review is being rejected…"
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-body-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-focus resize-none"
              />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => { setRejectMode(false); setRejectReason(""); }} disabled={loading}>
                  Cancel
                </Button>
                <Button variant="danger" size="sm" onClick={submitReject} loading={loading}>
                  Confirm Reject
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-2 p-4 border-t border-border bg-surface">
          <button
            onClick={() => setConfirmDelete(true)}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-body-sm text-danger hover:bg-danger/5 border border-danger/20 transition-colors"
            aria-label="Delete review"
          >
            <Trash2 className="size-3.5" />
            Delete
          </button>
          <div className="flex gap-2">
            {review.status !== "Published" && (
              <Button variant="secondary" size="sm" onClick={onPublish} loading={loading && !rejectMode} iconLeft={<Check className="size-3.5" />}>
                Publish
              </Button>
            )}
            {review.status !== "Rejected" && !rejectMode && (
              <Button variant="outline" size="sm" onClick={() => setRejectMode(true)} iconLeft={<X className="size-3.5" />}>
                Reject
              </Button>
            )}
            {review.status === "Published" && !rejectMode && (
              <Button variant="outline" size="sm" onClick={() => {
                // Reset to pending
                onReject("Reset to pending by admin");
              }}>
                Set Pending
              </Button>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={onDelete}
        title="Delete review"
        description="This will permanently delete the review. This cannot be undone."
        confirmLabel="Delete"
        confirmVariant="danger"
        loading={loading}
      />
    </div>
  );
}

// ── Main client ───────────────────────────────────────────────────────────────

export function AdminReviewsClient() {
  const [reviews, setReviews] = useState<AdminReviewResponse[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Detail view
  const [selected, setSelected] = useState<AdminReviewResponse | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await adminReviewsApi.list({
      page,
      pageSize: PAGE_SIZE,
      search: debouncedSearch || undefined,
      status: statusFilter || undefined,
    });
    if (res.ok) {
      setReviews(res.data.items);
      setTotalPages(res.data.totalPages);
      setTotalCount(res.data.totalCount);
    } else {
      setError(extractApiError(res.error, "Failed to load reviews."));
    }
    setLoading(false);
  }, [page, debouncedSearch, statusFilter]);

  useEffect(() => { void load(); }, [load]);

  // ── Actions ─────────────────────────────────────────────────────────────────

  async function handlePublish(review: AdminReviewResponse) {
    setActionLoading(true);
    const res = await adminReviewsApi.updateStatus(review.id, { status: "Published" });
    setActionLoading(false);
    if (res.ok) {
      // Update in-list and detail
      setReviews((prev) => prev.map((r) => r.id === review.id ? res.data : r));
      setSelected(res.data);
    }
  }

  async function handleReject(review: AdminReviewResponse, reason: string) {
    setActionLoading(true);
    const res = await adminReviewsApi.updateStatus(review.id, { status: "Rejected", reason });
    setActionLoading(false);
    if (res.ok) {
      setReviews((prev) => prev.map((r) => r.id === review.id ? res.data : r));
      setSelected(res.data);
    }
  }

  async function handleDelete(review: AdminReviewResponse) {
    setActionLoading(true);
    const res = await adminReviewsApi.delete(review.id);
    setActionLoading(false);
    if (res.ok) {
      setReviews((prev) => prev.filter((r) => r.id !== review.id));
      setSelected(null);
      setTotalCount((c) => c - 1);
    }
  }

  // ── Table columns ────────────────────────────────────────────────────────────

  const columns: Column<AdminReviewResponse>[] = [
    {
      key: "product",
      header: "Product",
      render: (row) => (
        <div>
          <p className="text-body-sm font-medium text-foreground line-clamp-1">{row.productName ?? "—"}</p>
          <p className="text-caption text-foreground-muted">{row.customerEmail ?? row.authorName}</p>
        </div>
      ),
    },
    {
      key: "rating",
      header: "Rating",
      render: (row) => <Stars rating={row.rating} />,
    },
    {
      key: "review",
      header: "Review",
      render: (row) => (
        <div className="max-w-xs">
          {row.title && <p className="text-body-sm font-medium text-foreground truncate">{row.title}</p>}
          {row.body && <p className="text-caption text-foreground-muted truncate">{row.body}</p>}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <div className="flex flex-col gap-1">
          <ReviewStatusBadge status={row.status} />
          {row.isVerifiedPurchase && (
            <span className="text-[10px] text-success font-semibold">✓ Verified</span>
          )}
        </div>
      ),
    },
    {
      key: "date",
      header: "Date",
      render: (row) => (
        <span className="text-caption text-foreground-muted whitespace-nowrap">
          {new Date(row.createdAtUtc).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-20",
      render: (row) => (
        <div className="flex items-center gap-1">
          {row.status === "Pending" && (
            <button
              onClick={(e) => { e.stopPropagation(); void handlePublish(row); }}
              aria-label="Publish review"
              title="Publish"
              className="h-7 w-7 flex items-center justify-center rounded text-foreground-muted hover:bg-success/10 hover:text-success transition-colors"
            >
              <Check className="size-3.5" />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); setSelected(row); }}
            aria-label="View review"
            title="View"
            className="h-7 w-7 flex items-center justify-center rounded text-foreground-muted hover:bg-muted hover:text-foreground transition-colors"
          >
            <Eye className="size-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Reviews"
        description={`${totalCount} review${totalCount !== 1 ? "s" : ""}`}
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-foreground-muted pointer-events-none" />
          <input
            type="search"
            placeholder="Search reviewer or product…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search reviews"
            className="h-9 pl-9 pr-3 w-56 rounded-md border border-border bg-background text-body-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-focus"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          aria-label="Filter by status"
          className="h-9 px-3 rounded-md border border-border bg-background text-body-sm text-foreground focus:outline-none focus:ring-2 focus:ring-focus"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s || "All statuses"}</option>
          ))}
        </select>
      </div>

      <AdminTable
        columns={columns}
        rows={reviews}
        rowKey={(r) => r.id}
        loading={loading}
        error={error}
        emptyTitle="No reviews"
        emptyDescription={statusFilter === "Pending" ? "No reviews pending moderation." : "Reviews will appear here once customers submit them."}
        onRetry={load}
        onRowClick={(row) => setSelected(row)}
      />

      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      )}

      {/* Detail overlay */}
      {selected && (
        <ReviewDetail
          review={selected}
          onPublish={() => handlePublish(selected)}
          onReject={(reason) => handleReject(selected, reason)}
          onDelete={() => handleDelete(selected)}
          onClose={() => setSelected(null)}
          loading={actionLoading}
        />
      )}
    </div>
  );
}
