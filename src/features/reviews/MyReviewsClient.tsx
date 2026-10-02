"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Star, Trash2, Edit2, MessageSquare, RefreshCw } from "lucide-react";
import { reviewsApi } from "@/services/api/reviews";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { MyReviewResponse } from "@/types/api";

// ── Status badge ──────────────────────────────────────────────────────────────

function ReviewStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; classes: string }> = {
    Pending:   { label: "Pending",   classes: "bg-warning/10 text-warning border-warning/20" },
    Published: { label: "Published", classes: "bg-success/10 text-success border-success/20" },
    Rejected:  { label: "Rejected",  classes: "bg-danger/10 text-danger border-danger/20"   },
  };
  const cfg = map[status] ?? { label: status, classes: "bg-muted text-foreground-muted border-border" };
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", cfg.classes)}>
      {cfg.label}
    </span>
  );
}

// ── Star display ──────────────────────────────────────────────────────────────

function StarDisplay({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "size-3.5",
            i < rating ? "fill-[#F59E0B] text-[#F59E0B]" : "fill-none text-[#e1e2e4]",
          )}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

// ── Main client ───────────────────────────────────────────────────────────────

export function MyReviewsClient() {
  const [reviews, setReviews] = useState<MyReviewResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    setError(null);
    const res = await reviewsApi.mine(p, 10);
    if (res.ok) {
      setReviews(res.data.items);
      setTotalPages(res.data.totalPages);
      setPage(p);
    } else {
      setError("Failed to load your reviews. Please try again.");
    }
    setLoading(false);
  }, []);

  useEffect(() => { void load(1); }, [load]);

  async function handleDelete(reviewId: string) {
    setDeleting(reviewId);
    const res = await reviewsApi.delete(reviewId);
    setDeleting(null);
    setDeleteConfirm(null);
    if (res.ok) {
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-7 w-36" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <p className="text-[14px] text-[#5A6578]">{error}</p>
        <Button variant="outline" size="sm" onClick={() => load(1)} iconLeft={<RefreshCw className="size-3.5" />}>
          Retry
        </Button>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center gap-5 py-16 text-center">
        <div className="h-16 w-16 rounded-full bg-[#f3f4f6] flex items-center justify-center">
          <MessageSquare className="size-7 text-[#c4c7c7]" />
        </div>
        <div>
          <h2 className="text-[18px] font-bold text-[#191c1e]">No reviews yet</h2>
          <p className="text-[13px] text-[#5A6578] mt-1">You haven&apos;t reviewed any products yet.</p>
        </div>
        <Link href="/shop">
          <Button variant="primary" size="sm">Browse Products</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-[18px] font-bold text-[#191c1e]">
        My Reviews <span className="text-[#5A6578] font-normal text-[15px]">({reviews.length})</span>
      </h2>

      <div className="flex flex-col gap-4">
        {reviews.map((review) => (
          <div key={review.id} className="rounded-2xl border border-[#e1e2e4] bg-white p-4 flex flex-col gap-3">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col gap-1">
                <StarDisplay rating={review.rating} />
                {review.title && (
                  <p className="text-[14px] font-bold text-[#191c1e]">{review.title}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <ReviewStatusBadge status={review.status ?? "Pending"} />
              </div>
            </div>

            {/* Body */}
            {review.body && (
              <p className="text-[13px] text-[#444748] leading-relaxed line-clamp-3">{review.body}</p>
            )}

            {/* Images */}
            {review.images && review.images.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {review.images.map((img) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={img.id}
                    src={img.url}
                    alt="Review photo"
                    className="h-12 w-12 rounded-lg object-cover border border-[#e1e2e4]"
                    loading="lazy"
                  />
                ))}
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#f3f4f6]">
              <span className="text-[11px] text-[#5A6578]">
                {new Date(review.createdAtUtc).toLocaleDateString("en-IN", {
                  year: "numeric", month: "short", day: "numeric",
                })}
                {review.isVerifiedPurchase && (
                  <span className="ml-2 text-success font-bold">✓ Verified</span>
                )}
              </span>
              <div className="flex items-center gap-1">
                {deleteConfirm === review.id ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] text-[#5A6578]">Delete this review?</span>
                    <Button
                      variant="danger"
                      size="sm"
                      loading={deleting === review.id}
                      onClick={() => handleDelete(review.id)}
                    >
                      Delete
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteConfirm(null)}
                      disabled={deleting === review.id}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <>
                    <Link
                      href={`/products/${review.productId}`}
                      className="flex items-center gap-1 h-7 px-2.5 rounded-lg text-[12px] text-[#5A6578] border border-[#e1e2e4] hover:border-[#0D0D0D] hover:text-[#191c1e] transition-colors"
                    >
                      <Edit2 className="size-3" />
                      View Product
                    </Link>
                    <button
                      onClick={() => setDeleteConfirm(review.id)}
                      aria-label="Delete review"
                      className="flex items-center justify-center h-7 w-7 rounded-lg text-[#5A6578] hover:text-danger hover:bg-danger/5 transition-colors"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => load(page - 1)}>
            Previous
          </Button>
          <span className="text-[13px] text-[#5A6578]">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => load(page + 1)}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
