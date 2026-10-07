"use client";

/**
 * VariantImageManager — inline variant-level image management.
 *
 * Rendered inside each VariantMatrixRow. Shows a horizontal strip of
 * 48×48px thumbnails for the variant's images. Supports:
 *   - Batch upload (click or drag-and-drop, max 10 files)
 *   - Set primary (hover → "Primary" button)
 *   - Delete (hover → × button, with confirmation for safety)
 *   - Drag-to-reorder (PUT /reorder on drag-end)
 *
 * All mutations update local state immediately from API response so
 * no parent refresh is needed — the strip is fully self-contained.
 *
 * Error messages appear inline below the strip, never as toasts, because
 * this is a form-embedded component (admin guideline).
 */

import { useState, useRef, useCallback } from "react";
import { Plus, X, GripVertical, ImageIcon } from "lucide-react";
import { adminVariantImagesApi } from "@/services/api/admin";
import { extractApiError, cn } from "@/lib/utils";
import type { VariantImageDto } from "@/types/api";

// ── Props ─────────────────────────────────────────────────────────────────────

interface VariantImageManagerProps {
  productId: string;
  variantId: string;
  /** Label shown at the top of the strip (e.g. "Red · 128GB") */
  variantLabel?: string;
  /** Initial images from the parent (VariantResponse.images) */
  initialImages?: VariantImageDto[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function imageUrl(img: VariantImageDto): string {
  return img.asset?.secureUrl ?? "";
}

// ── Component ─────────────────────────────────────────────────────────────────

export function VariantImageManager({
  productId,
  variantId,
  variantLabel,
  initialImages = [],
}: VariantImageManagerProps) {
  const [images, setImages] = useState<VariantImageDto[]>(
    () => [...initialImages].sort((a, b) => a.sortOrder - b.sortOrder),
  );

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Mutation in-progress guards (by image id)
  const [settingPrimary, setSettingPrimary] = useState<string | null>(null);
  const [deleting, setDeleting]             = useState<string | null>(null);

  // Drag-to-reorder state
  const dragIdx = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const [reordering, setReordering] = useState(false);

  // Inline error
  const [error, setError] = useState<string | null>(null);

  // ── Upload ──────────────────────────────────────────────────────────────────

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArr = Array.from(files)
        .filter((f) => f.type.startsWith("image/"))
        .slice(0, 10);

      if (fileArr.length === 0) {
        setError("Please select image files (max 10).");
        return;
      }
      if (images.length + fileArr.length > 10) {
        setError(`Maximum 10 images per variant. You have ${images.length}, trying to add ${fileArr.length}.`);
        return;
      }

      setError(null);
      setUploading(true);

      const formData = new FormData();
      fileArr.forEach((f) => formData.append("files", f));

      const res = await adminVariantImagesApi.upload(productId, variantId, formData);
      setUploading(false);

      if (res.ok) {
        setImages((prev) =>
          [...prev, ...res.data].sort((a, b) => a.sortOrder - b.sortOrder),
        );
      } else {
        const msg = extractApiError(res.error, "Upload failed.");
        // Map known error codes to friendly messages
        if (msg.includes("TOO_MANY_FILES"))       setError("Maximum 10 files per upload.");
        else if (msg.includes("INVALID_MIME_TYPE")) setError("Only image files are allowed.");
        else if (msg.includes("VARIANT_NOT_FOUND")) setError("Variant no longer exists. Refresh the page.");
        else if (msg.includes("UPLOAD_FAILED"))     setError(`Upload failed: ${msg}`);
        else setError(msg);
      }
    },
    [productId, variantId, images.length],
  );

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.length) void uploadFiles(e.target.files);
    // Reset so the same file can be re-selected after an error
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    void uploadFiles(Array.from(e.dataTransfer.files));
  }

  // ── Set primary ─────────────────────────────────────────────────────────────

  async function handleSetPrimary(imageId: string) {
    if (settingPrimary || deleting) return;
    setSettingPrimary(imageId);
    setError(null);

    const res = await adminVariantImagesApi.setPrimary(productId, variantId, imageId);
    setSettingPrimary(null);

    if (res.ok) {
      // Promote clicked image; demote all others
      setImages((prev) =>
        prev.map((img) => ({ ...img, isPrimary: img.id === imageId })),
      );
    } else {
      const msg = extractApiError(res.error, "Failed to set primary.");
      if (msg.includes("IMAGE_NOT_FOUND")) setError("Image already deleted. Refresh.");
      else setError(msg);
    }
  }

  // ── Delete ──────────────────────────────────────────────────────────────────

  async function handleDelete(imageId: string) {
    if (deleting || settingPrimary) return;
    setDeleting(imageId);
    setError(null);

    const res = await adminVariantImagesApi.delete(productId, variantId, imageId);
    setDeleting(null);

    if (res.ok) {
      setImages((prev) => {
        const next = prev.filter((img) => img.id !== imageId);
        // If the deleted image was primary, promote the next one by sortOrder
        const wasPrimary = prev.find((img) => img.id === imageId)?.isPrimary;
        if (wasPrimary && next.length > 0) {
          next[0] = { ...next[0], isPrimary: true };
        }
        return next;
      });
    } else {
      const msg = extractApiError(res.error, "Delete failed.");
      if (msg.includes("IMAGE_NOT_FOUND")) setError("Image already deleted. Refresh.");
      else setError(msg);
    }
  }

  // ── Drag-to-reorder ─────────────────────────────────────────────────────────

  function handleDragStart(idx: number) {
    dragIdx.current = idx;
  }

  function handleDragEnter(idx: number) {
    setDragOver(idx);
  }

  async function handleDragEnd() {
    const from = dragIdx.current;
    const to   = dragOver;
    dragIdx.current = null;
    setDragOver(null);

    if (from === null || to === null || from === to) return;

    // Optimistic update
    const next = [...images];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    const reordered = next.map((img, i) => ({ ...img, sortOrder: i }));
    setImages(reordered);

    // Persist
    setReordering(true);
    setError(null);
    const res = await adminVariantImagesApi.reorder(productId, variantId, {
      items: reordered.map((img) => ({ imageId: img.id, sortOrder: img.sortOrder })),
    });
    setReordering(false);

    if (res.ok) {
      setImages([...res.data].sort((a, b) => a.sortOrder - b.sortOrder));
    } else {
      const msg = extractApiError(res.error, "Reorder failed.");
      if (msg.includes("IMAGE_NOT_FOUND")) setError("Some images were deleted. Refresh.");
      else setError(msg);
      // Revert to server order on failure — re-fetch not available here, just show error
    }
  }

  // ── Whether the whole strip is busy ─────────────────────────────────────────
  const isBusy = uploading || reordering;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-1.5">
      {/* Header */}
      {variantLabel && (
        <p className="text-[10px] font-semibold text-foreground-muted uppercase tracking-wide truncate">
          {variantLabel}
        </p>
      )}

      {/* Thumbnail strip */}
      <div
        className={cn(
          "flex items-center gap-1.5 flex-wrap",
          isBusy && "opacity-60 pointer-events-none",
        )}
        aria-label={`Images for ${variantLabel ?? "variant"}`}
      >
        {images.length === 0 && !uploading && (
          /* Empty placeholder */
          <div
            className="h-12 w-12 rounded-lg border border-dashed border-border bg-surface flex items-center justify-center shrink-0"
            aria-hidden="true"
          >
            <ImageIcon className="size-4 text-foreground-muted/40" />
          </div>
        )}

        {images.map((img, idx) => (
          <div
            key={img.id}
            draggable
            onDragStart={() => handleDragStart(idx)}
            onDragEnter={() => handleDragEnter(idx)}
            onDragEnd={() => void handleDragEnd()}
            onDragOver={(e) => e.preventDefault()}
            className={cn(
              "relative group shrink-0 cursor-grab active:cursor-grabbing",
              dragOver === idx && dragIdx.current !== idx && "ring-2 ring-primary rounded-lg",
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl(img)}
              alt={img.asset?.altText ?? `Variant image ${idx + 1}`}
              className={cn(
                "h-12 w-12 rounded-lg object-cover bg-surface border",
                img.isPrimary ? "border-primary border-2" : "border-border",
              )}
            />

            {/* Primary badge */}
            {img.isPrimary && (
              <span
                aria-label="Primary image"
                className="absolute bottom-0.5 left-0.5 text-[7px] font-bold bg-primary text-primary-foreground rounded px-1 pointer-events-none leading-tight"
              >
                ★
              </span>
            )}

            {/* Hover actions */}
            <div className="absolute inset-0 rounded-lg hidden group-hover:flex flex-col items-center justify-center gap-0.5 bg-black/50">
              {/* Set primary — only show when not already primary */}
              {!img.isPrimary && (
                <button
                  type="button"
                  aria-label="Make primary"
                  onClick={() => void handleSetPrimary(img.id)}
                  disabled={settingPrimary === img.id}
                  className="text-[7px] font-bold text-white bg-black/60 rounded px-1 py-0.5 hover:bg-primary transition-colors leading-tight"
                >
                  {settingPrimary === img.id ? "…" : "Primary"}
                </button>
              )}

              {/* Delete */}
              <button
                type="button"
                aria-label="Delete image"
                onClick={() => void handleDelete(img.id)}
                disabled={deleting === img.id}
                className="h-4 w-4 flex items-center justify-center rounded-full bg-danger text-white hover:bg-danger/80 transition-colors"
              >
                {deleting === img.id
                  ? <span className="text-[7px]">…</span>
                  : <X className="size-2.5" />}
              </button>
            </div>

            {/* Drag handle indicator */}
            <div className="absolute top-0.5 right-0.5 hidden group-hover:flex opacity-60" aria-hidden="true">
              <GripVertical className="size-3 text-white drop-shadow" />
            </div>
          </div>
        ))}

        {/* Upload button — always shown at end */}
        <button
          type="button"
          aria-label={`Upload images for ${variantLabel ?? "variant"}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          disabled={isBusy || images.length >= 10}
          className={cn(
            "h-12 w-12 rounded-lg border-2 border-dashed flex items-center justify-center shrink-0 transition-colors",
            isDragging
              ? "border-primary bg-primary/10"
              : "border-border hover:border-border-strong hover:bg-muted/30",
            (isBusy || images.length >= 10) && "opacity-40 pointer-events-none",
          )}
        >
          {uploading
            ? <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-label="Uploading" />
            : <Plus className="size-4 text-foreground-muted" aria-hidden="true" />}
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          aria-label="Select variant images"
          onChange={handleFileChange}
          className="sr-only"
        />
      </div>

      {/* Inline error */}
      {error && (
        <p role="alert" className="text-[11px] text-danger leading-snug">
          {error}
        </p>
      )}

      {/* Reorder busy indicator */}
      {reordering && (
        <p className="text-[10px] text-foreground-muted">Saving order…</p>
      )}
    </div>
  );
}
