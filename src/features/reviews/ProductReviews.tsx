"use client";

/**
 * ProductReviews — public + customer review section for the product detail page.
 *
 * Layout:
 *  ┌─────────────────────────────────────────┐
 *  │ Rating summary (avg + breakdown)        │
 *  │ Write a review CTA (authenticated only) │
 *  │ Review list with sort/filter            │
 *  │ Pagination                              │
 *  └─────────────────────────────────────────┘
 */

import { useState, useCallback, useEffect } from "react";
import { Star, ThumbsUp, ChevronDown, X, ImagePlus } from "lucide-react";
import { reviewsApi } from "@/services/api/reviews";
import { useAuth } from "@/features/auth/AuthContext";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type {
  ReviewResponse,
  ReviewListResponse,
  CreateReviewRequest,
  ReviewImageUploadResponse,
} from "@/types/api";

interface ProductReviewsProps {
  productId: string;
  productName: string;
}

// ── Star display ──────────────────────────────────────────────────────────────

function StarDisplay({ rating, max = 5, size = "sm" }: { rating: number; max?: number; size?: "sm" | "md" | "lg" }) {
  const iconClass = size === "lg" ? "size-5" : size === "md" ? "size-4" : "size-3.5";
  return (
    <span className="flex items-center gap-0.5" aria-label={`${rating} out of ${max} stars`}>
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={cn(iconClass, i < Math.round(rating) ? "fill-warning text-warning" : "fill-none text-border")}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

// ── Interactive star picker ───────────────────────────────────────────────────

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  const display = hovered || value;
  return (
    <span className="flex items-center gap-1" aria-label={`Select rating: ${value} stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <button
          key={i}
          type="button"
          aria-label={`${i + 1} star${i > 0 ? "s" : ""}`}
          onClick={() => onChange(i + 1)}
          onMouseEnter={() => setHovered(i + 1)}
          onMouseLeave={() => setHovered(0)}
          className="focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus rounded"
        >
          <Star
            className={cn(
              "size-7 transition-colors",
              i < display ? "fill-warning text-warning" : "fill-none text-border hover:text-warning",
            )}
          />
        </button>
      ))}
    </span>
  );
}

// ── Rating summary bar ────────────────────────────────────────────────────────

function RatingBar({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-[12px]">
      <span className="w-8 shrink-0 text-right text-foreground-muted">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full bg-warning transition-all duration-500" style={{ width: `${pct}%` }} aria-hidden="true" />
      </div>
      <span className="w-6 shrink-0 text-foreground-muted">{count}</span>
    </div>
  );
}

// ── Review card ───────────────────────────────────────────────────────────────

function ReviewCard({
  review,
  onHelpful,
}: {
  review: ReviewResponse;
  onHelpful: (id: string) => void;
}) {
  const [helpfulCount, setHelpfulCount] = useState(review.helpfulCount);
  const [voting, setVoting] = useState(false);

  async function handleHelpful() {
    if (voting) return;
    setVoting(true);
    const res = await reviewsApi.toggleHelpful(review.id);
    if (res.ok) {
      setHelpfulCount(res.data.helpfulCount);
      onHelpful(review.id);
    }
    setVoting(false);
  }

  const date = review.publishedAtUtc
    ? new Date(review.publishedAtUtc).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })
    : new Date(review.createdAtUtc).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });

  return (
    <div className="border-b border-border/40 pb-6 last:border-none">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-[12px] font-bold shrink-0">
            {(review.authorName?.[0] ?? "A").toUpperCase()}
          </span>
          <div>
            <p className="text-[13px] font-semibold text-foreground">{review.authorName ?? "Customer"}</p>
            {review.isVerifiedPurchase && (
              <span className="text-[10px] font-bold text-success uppercase tracking-wide">
                ✓ Verified Purchase
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <StarDisplay rating={review.rating} size="sm" />
          <span className="text-[11px] text-foreground-muted">{date}</span>
        </div>
      </div>

      {/* Content */}
      {review.title && (
        <p className="text-[14px] font-bold text-foreground mb-1">{review.title}</p>
      )}
      {review.body && (
        <p className="text-[13px] text-foreground-muted leading-relaxed">{review.body}</p>
      )}

      {/* Images */}
      {review.images && review.images.length > 0 && (
        <div className="flex gap-2 mt-3 flex-wrap">
          {review.images.map((img) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={img.id}
              src={img.url}
              alt="Review photo"
              className="h-16 w-16 rounded-lg object-cover bg-muted border border-border"
              loading="lazy"
            />
          ))}
        </div>
      )}

      {/* Helpful */}
      <button
        type="button"
        onClick={handleHelpful}
        disabled={voting}
        className="mt-3 flex items-center gap-1.5 text-[12px] text-foreground-muted hover:text-foreground transition-colors disabled:opacity-50"
      >
        <ThumbsUp className="size-3.5" aria-hidden="true" />
        Helpful {helpfulCount > 0 && `(${helpfulCount})`}
      </button>
    </div>
  );
}

// ── Write review form ─────────────────────────────────────────────────────────

interface WriteReviewFormProps {
  productId: string;
  onSubmitted: () => void;
  onCancel: () => void;
}

function WriteReviewForm({ productId, onSubmitted, onCancel }: WriteReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [uploadedImages, setUploadedImages] = useState<ReviewImageUploadResponse[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (uploadedImages.length >= 5) { setError("Maximum 5 images per review."); return; }
    setUploading(true);
    setError("");
    const res = await reviewsApi.uploadImage(file);
    setUploading(false);
    if (res.ok) {
      setUploadedImages((prev) => [...prev, res.data]);
    } else {
      setError("Failed to upload image. Only JPEG, PNG, WebP, AVIF accepted.");
    }
    // Reset input so same file can be re-uploaded if needed
    e.target.value = "";
  }

  function removeImage(publicId: string) {
    setUploadedImages((prev) => prev.filter((i) => i.publicId !== publicId));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) { setError("Please select a rating."); return; }
    setError("");
    setSaving(true);

    const payload: CreateReviewRequest = {
      rating,
      title: title.trim() || undefined,
      body: body.trim() || undefined,
      images: uploadedImages.length > 0 ? uploadedImages : undefined,
    };

    const res = await reviewsApi.create(productId, payload);
    setSaving(false);
    if (res.ok) {
      onSubmitted();
    } else {
      const errMsg = res.error && "message" in res.error ? res.error.message : "Failed to submit review.";
      // 409 = already reviewed
      if (res.error && "status" in res.error && res.error.status === 409) {
        setError("You have already reviewed this product.");
      } else {
        setError(errMsg);
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="rounded-2xl border border-border bg-surface-elevated p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-bold text-foreground">Write a Review</h3>
        <button type="button" onClick={onCancel} className="text-foreground-muted hover:text-foreground">
          <X className="size-4" />
        </button>
      </div>

      {error && (
        <p role="alert" className="text-[12px] text-danger bg-danger/5 border border-danger/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* Star rating */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[12px] font-semibold text-foreground uppercase tracking-wide">
          Your Rating <span className="text-danger">*</span>
        </label>
        <StarPicker value={rating} onChange={setRating} />
      </div>

      {/* Title */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="review-title" className="text-[12px] font-semibold text-foreground uppercase tracking-wide">
          Review Title
        </label>
        <input
          id="review-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          placeholder="Sum up your experience"
          className="w-full h-9 px-3 rounded-lg border border-border bg-surface-container text-[13px] text-foreground placeholder:text-foreground-muted focus:outline-none focus:bg-surface-elevated focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Body */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="review-body" className="text-[12px] font-semibold text-foreground uppercase tracking-wide">
          Your Review
        </label>
        <textarea
          id="review-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          placeholder="Tell others what you think about this product…"
          className="w-full px-3 py-2 rounded-lg border border-border bg-surface-container text-[13px] text-foreground placeholder:text-foreground-muted focus:outline-none focus:bg-surface-elevated focus:ring-2 focus:ring-primary/20 resize-none"
        />
      </div>

      {/* Image upload */}
      <div className="flex flex-col gap-2">
        <label className="text-[12px] font-semibold text-foreground uppercase tracking-wide">
          Photos (optional, up to 5)
        </label>
        <div className="flex flex-wrap gap-2">
          {uploadedImages.map((img) => (
            <div key={img.publicId} className="relative group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="Review upload" className="h-14 w-14 rounded-lg object-cover border border-border" />
              <button
                type="button"
                onClick={() => removeImage(img.publicId)}
                className="absolute -top-1 -right-1 hidden group-hover:flex h-4 w-4 items-center justify-center rounded-full bg-danger text-white"
                aria-label="Remove photo"
              >
                <X className="size-2.5" />
              </button>
            </div>
          ))}
          {uploadedImages.length < 5 && (
            <label
              className={cn(
                "flex h-14 w-14 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border text-border",
                "hover:border-primary hover:text-foreground-muted transition-colors",
                uploading && "opacity-50 pointer-events-none",
              )}
              aria-label="Upload photo"
            >
              {uploading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              ) : (
                <ImagePlus className="size-4" />
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                className="sr-only"
                onChange={handleImageUpload}
                disabled={uploading}
              />
            </label>
          )}
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" size="sm" loading={saving}>
          Submit Review
        </Button>
      </div>
    </form>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function ProductReviews({ productId, productName }: ProductReviewsProps) {
  const { isAuthenticated } = useAuth();
  const [data, setData] = useState<ReviewListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<"recent" | "helpful" | "rating">("recent");
  const [ratingFilter, setRatingFilter] = useState<number | undefined>(undefined);
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const load = useCallback(async (p: number, s: "recent" | "helpful" | "rating", r?: number) => {
    setLoading(true);
    setError(null);
    const res = await reviewsApi.list(productId, { page: p, pageSize: 10, sort: s, rating: r });
    if (res.ok) {
      setData(res.data);
      setPage(p);
    } else {
      setError("Failed to load reviews.");
    }
    setLoading(false);
  }, [productId]);

  useEffect(() => { void load(1, sort, ratingFilter); }, [load, sort, ratingFilter]);

  function handleSortChange(s: "recent" | "helpful" | "rating") {
    setSort(s);
    setPage(1);
  }

  function handleRatingFilter(r: number | undefined) {
    setRatingFilter(r);
    setPage(1);
  }

  function handleSubmitted() {
    setShowForm(false);
    setSubmitted(true);
    // Refresh reviews after a short delay for the pending state message to make sense
    setTimeout(() => void load(1, sort, ratingFilter), 1000);
  }

  const reviews = data?.page?.items ?? [];
  const totalPages = data?.page?.totalPages ?? 1;
  const ratingAvg = data?.ratingAverage ?? 0;
  const ratingCount = data?.ratingCount ?? 0;
  const breakdown = data?.breakdown?.byRating ?? {};

  return (
    <section aria-labelledby="reviews-heading" className="mt-12 border-t border-border pt-10">
      <h2 id="reviews-heading" className="text-[20px] font-extrabold text-foreground mb-6">
        Customer Reviews
      </h2>

      {/* Rating summary */}
      {ratingCount > 0 && (
        <div className="flex flex-col sm:flex-row gap-6 mb-8 p-5 rounded-2xl bg-background border border-border">
          {/* Average */}
          <div className="flex flex-col items-center gap-1 sm:border-r sm:border-border sm:pr-6 shrink-0">
            <span className="text-[48px] font-extrabold text-foreground leading-none tabular-nums">
              {ratingAvg.toFixed(1)}
            </span>
            <StarDisplay rating={ratingAvg} size="md" />
            <span className="text-[12px] text-foreground-muted">{ratingCount} review{ratingCount !== 1 ? "s" : ""}</span>
          </div>
          {/* Breakdown bars */}
          <div className="flex-1 flex flex-col gap-1.5 justify-center">
            {[5, 4, 3, 2, 1].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => handleRatingFilter(ratingFilter === star ? undefined : star)}
                className={cn(
                  "w-full text-left transition-opacity",
                  ratingFilter !== undefined && ratingFilter !== star ? "opacity-40" : "",
                )}
              >
                <RatingBar
                  label={`${star}★`}
                  count={breakdown[String(star)] ?? 0}
                  total={ratingCount}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Write review CTA */}
      {!showForm && (
        <div className="mb-6 flex items-center gap-3 flex-wrap">
          {isAuthenticated ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowForm(true)}
              className="rounded-xl"
            >
              Write a Review
            </Button>
          ) : (
            <p className="text-[13px] text-foreground-muted">
              <a href="/auth/login" className="underline underline-offset-2 text-foreground font-medium hover:opacity-70">
                Sign in
              </a>{" "}
              to write a review for {productName}.
            </p>
          )}
          {submitted && (
            <p className="text-[13px] text-success font-semibold">
              ✓ Your review was submitted and is awaiting moderation.
            </p>
          )}
        </div>
      )}

      {/* Write review form */}
      {showForm && (
        <div className="mb-8">
          <WriteReviewForm
            productId={productId}
            onSubmitted={handleSubmitted}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Sort + filter controls */}
      {(ratingCount > 0 || !loading) && (
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <div className="flex items-center gap-1.5">
            <label htmlFor="review-sort" className="text-[12px] text-foreground-muted font-medium">Sort:</label>
            <div className="relative">
              <select
                id="review-sort"
                value={sort}
                onChange={(e) => handleSortChange(e.target.value as "recent" | "helpful" | "rating")}
                className="appearance-none h-8 pl-3 pr-8 rounded-lg border border-border bg-surface-container text-[12px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="recent">Most Recent</option>
                <option value="helpful">Most Helpful</option>
                <option value="rating">Highest Rated</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 size-3.5 text-foreground-muted" />
            </div>
          </div>
          {ratingFilter !== undefined && (
            <button
              type="button"
              onClick={() => handleRatingFilter(undefined)}
              className="flex items-center gap-1.5 text-[12px] text-foreground-muted hover:text-danger border border-border rounded-full px-3 py-1 transition-colors"
            >
              {ratingFilter}★ filter <X className="size-3" />
            </button>
          )}
        </div>
      )}

      {/* Review list */}
      {loading ? (
        <ReviewsSkeleton />
      ) : error ? (
        <p className="text-[13px] text-danger">{error}</p>
      ) : reviews.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-[14px] text-foreground-muted">
            {ratingFilter ? `No ${ratingFilter}-star reviews yet.` : "No reviews yet. Be the first to review this product."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} onHelpful={() => {}} />
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4 border-t border-border">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => load(page - 1, sort, ratingFilter)}>Previous</Button>
              <span className="text-[13px] text-foreground-muted">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => load(page + 1, sort, ratingFilter)}>Next</Button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function ReviewsSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-hidden="true">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="border-b border-border/40 pb-6 flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ))}
    </div>
  );
}
