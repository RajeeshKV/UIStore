"use client";

import {
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Upload,
  X,
  GripVertical,
  Eye,
  EyeOff,
  Images,
} from "lucide-react";
import { adminCarouselApi } from "@/services/api/admin";
import { AdminPageHeader } from "@/features/admin/AdminPageHeader";
import { AdminTable, type Column } from "@/features/admin/AdminTable";
import { AdminDialog, ConfirmDialog } from "@/features/admin/AdminDialog";
import { AdminStatusBadge } from "@/features/admin/AdminStatusBadge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { extractApiError, cn } from "@/lib/utils";
import type {
  CarouselSlideResponse,
  CreateCarouselSlideRequest,
} from "@/types/api";

// ── Empty form ────────────────────────────────────────────────────────────────

const emptyForm: CreateCarouselSlideRequest = {
  title: "",
  subtitle: "",
  ctaText: "Shop Now",
  sortOrder: 0,
  isActive: true,
};

// ── Image upload cell ─────────────────────────────────────────────────────────

function SlideImageUpload({
  slide,
  onRefresh,
}: {
  slide: CarouselSlideResponse;
  onRefresh: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await adminCarouselApi.uploadImage(slide.id, fd);
    setUploading(false);
    if (res.ok) {
      onRefresh();
    } else {
      setError(extractApiError(res.error, "Upload failed."));
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="flex flex-col gap-1.5">
      {/* Image preview */}
      {slide.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={slide.imageUrl}
          alt={slide.title ?? "Slide"}
          className="h-14 w-28 rounded-lg object-cover border border-border bg-surface"
        />
      ) : (
        <div className="h-14 w-28 rounded-lg bg-muted border border-dashed border-border flex items-center justify-center">
          <Images className="size-4 text-foreground-muted" />
        </div>
      )}
      {/* Upload button below the image */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        aria-label="Upload slide image"
        onChange={handleUpload}
        className="sr-only"
        id={`slide-img-${slide.id}`}
      />
      <label
        htmlFor={`slide-img-${slide.id}`}
        className={cn(
          "inline-flex items-center gap-1 h-6 px-2 rounded-md w-fit",
          "border border-border text-[11px] text-foreground cursor-pointer",
          "hover:bg-muted transition-colors whitespace-nowrap",
          uploading && "opacity-60 pointer-events-none",
        )}
      >
        <Upload className="size-3 shrink-0" />
        {uploading ? "Uploading…" : slide.imageUrl ? "Replace" : "Upload"}
      </label>
      <p className="text-[10px] text-foreground-muted">PNG, JPG, WebP</p>
      {error && <p className="text-caption text-danger">{error}</p>}
    </div>
  );
}

// ── Inline toggle active ──────────────────────────────────────────────────────

function ToggleActive({
  slide,
  onRefresh,
}: {
  slide: CarouselSlideResponse;
  onRefresh: () => void;
}) {
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    await adminCarouselApi.update(slide.id, {
      title: slide.title,
      subtitle: slide.subtitle,
      ctaText: slide.ctaText,
      sortOrder: slide.sortOrder,
      isActive: !slide.isActive,
    });
    setLoading(false);
    onRefresh();
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      aria-label={slide.isActive ? "Deactivate slide" : "Activate slide"}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded transition-colors",
        "text-foreground-muted hover:bg-muted hover:text-foreground",
        loading && "opacity-50",
      )}
    >
      {slide.isActive ? (
        <Eye className="size-3.5" />
      ) : (
        <EyeOff className="size-3.5" />
      )}
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function AdminCarouselClient() {
  const [slides, setSlides] = useState<CarouselSlideResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create / edit dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CarouselSlideResponse | null>(null);
  const [form, setForm] = useState<CreateCarouselSlideRequest>(emptyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");
  const [saving, setSaving] = useState(false);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<CarouselSlideResponse | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── Data loading ────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await adminCarouselApi.list(false); // fetch all, including inactive
    if (res.ok) {
      setSlides([...res.data].sort((a, b) => a.sortOrder - b.sortOrder));
    } else {
      setError(extractApiError(res.error, "Failed to load carousel slides."));
    }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  // ── Dialog helpers ──────────────────────────────────────────────────────────

  function openCreate() {
    setEditTarget(null);
    setForm({ ...emptyForm, sortOrder: slides.length });
    setFormErrors({});
    setApiError("");
    setDialogOpen(true);
  }

  function openEdit(slide: CarouselSlideResponse) {
    setEditTarget(slide);
    setForm({
      title: slide.title ?? "",
      subtitle: slide.subtitle ?? "",
      ctaText: slide.ctaText ?? "Shop Now",
      sortOrder: slide.sortOrder,
      isActive: slide.isActive,
    });
    setFormErrors({});
    setApiError("");
    setDialogOpen(true);
  }

  // ── Validation ──────────────────────────────────────────────────────────────

  function validate(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!form.title?.trim()) e.title = "Title is required.";
    if (form.sortOrder < 0) e.sortOrder = "Sort order must be 0 or greater.";
    return e;
  }

  // ── Save ────────────────────────────────────────────────────────────────────

  async function handleSave() {
    const errs = validate();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setFormErrors({});
    setApiError("");
    setSaving(true);

    const payload: CreateCarouselSlideRequest = {
      title: form.title?.trim() || null,
      subtitle: form.subtitle?.trim() || null,
      ctaText: form.ctaText?.trim() || null,
      sortOrder: Number(form.sortOrder),
      isActive: form.isActive,
    };

    const res = editTarget
      ? await adminCarouselApi.update(editTarget.id, payload)
      : await adminCarouselApi.create(payload);

    setSaving(false);
    if (res.ok) {
      setDialogOpen(false);
      void load();
    } else {
      setApiError(extractApiError(res.error, "Failed to save slide."));
    }
  }

  // ── Delete ──────────────────────────────────────────────────────────────────

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await adminCarouselApi.delete(deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
    if (res.ok) void load();
  }

  // ── Table columns ───────────────────────────────────────────────────────────

  const columns: Column<CarouselSlideResponse>[] = [
    {
      key: "order",
      header: "#",
      className: "w-10 text-center",
      render: (row) => (
        <div className="flex items-center justify-center gap-1">
          <GripVertical className="size-3.5 text-foreground-muted/40" aria-hidden="true" />
          <span className="text-caption text-foreground-muted tabular-nums">{row.sortOrder}</span>
        </div>
      ),
    },
    {
      key: "image",
      header: "Image",
      className: "w-36 min-w-[9rem]",
      render: (row) => (
        <SlideImageUpload slide={row} onRefresh={load} />
      ),
    },
    {
      key: "content",
      header: "Content",
      render: (row) => (
        <div className="flex flex-col gap-0.5 min-w-0 max-w-[220px]">
          <p className="text-body-sm font-semibold text-foreground truncate">
            {row.title ?? <span className="text-foreground-muted italic">No title</span>}
          </p>
          {row.subtitle && (
            <p className="text-caption text-foreground-muted truncate">
              {row.subtitle}
            </p>
          )}
          {row.ctaText && (
            <span className="mt-1 self-start inline-flex items-center px-2 py-0.5 rounded-full bg-muted text-[10px] font-medium text-foreground-muted whitespace-nowrap">
              CTA: {row.ctaText}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      className: "w-28",
      render: (row) => (
        <AdminStatusBadge
          status={row.isActive ? "active" : "inactive"}
          label={row.isActive ? "Active" : "Inactive"}
        />
      ),
    },
    {
      key: "updated",
      header: "Updated",
      className: "w-32 hidden md:table-cell",
      render: (row) => (
        <span className="text-caption text-foreground-muted tabular-nums">
          {new Date(row.updatedAtUtc).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-24",
      render: (row) => (
        <div className="flex items-center gap-0.5">
          <ToggleActive slide={row} onRefresh={load} />
          <button
            aria-label="Edit slide"
            onClick={() => openEdit(row)}
            className="flex h-7 w-7 items-center justify-center rounded text-foreground-muted hover:bg-muted hover:text-foreground transition-colors"
          >
            <Pencil className="size-3.5" />
          </button>
          <button
            aria-label="Delete slide"
            onClick={() => setDeleteTarget(row)}
            className="flex h-7 w-7 items-center justify-center rounded text-foreground-muted hover:bg-danger/10 hover:text-danger transition-colors"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      ),
    },
  ];

  // ── Render ──────────────────────────────────────────────────────────────────

  const activeCount = slides.filter((s) => s.isActive).length;
  const description = loading
    ? "Loading..."
    : `${slides.length} slide${slides.length !== 1 ? "s" : ""} total, ${activeCount} active`;

  return (
    <>
      {/* Page body */}
      <div className="flex flex-col gap-6">
        <AdminPageHeader
          title="Carousel"
          description={description}
          action={
            <Button variant="primary" size="sm" onClick={openCreate}>
              <Plus className="size-4 mr-1.5" />
              New Slide
            </Button>
          }
        />

        {/* Info callout */}
        <div className="rounded-lg border border-border bg-surface px-4 py-3 flex items-start gap-3">
          <Images className="size-4 text-foreground-muted mt-0.5 shrink-0" aria-hidden="true" />
          <div className="text-body-sm text-foreground-muted">
            <strong className="text-foreground font-medium">How it works:</strong>{" "}
            Create a slide, then upload its image. Only active slides appear on the storefront.
            The Shop Now CTA always navigates to the Shop page — you can customise the button label per slide.
          </div>
        </div>

        <AdminTable
          columns={columns}
          rows={slides}
          rowKey={(r) => r.id}
          loading={loading}
          error={error}
          emptyTitle="No slides yet"
          emptyDescription="Add your first carousel slide to display a hero banner on the home page."
          onRetry={load}
        />
      </div>

      {/* Create / Edit dialog */}
      <AdminDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editTarget ? "Edit Slide" : "New Slide"}
        description={
          editTarget
            ? "Update the slide content. Upload the image separately using the table row."
            : "After creating the slide, upload its image using the Upload button in the table."
        }
      >
        <div className="flex flex-col gap-4">
          {apiError && (
            <p
              role="alert"
              className="text-body-sm text-danger bg-danger/5 border border-danger/20 rounded-md px-4 py-3"
            >
              {apiError}
            </p>
          )}

          <Input
            label="Title"
            required
            placeholder="e.g. MacBook Air M4"
            value={form.title ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            error={formErrors.title}
          />

          <Input
            label="Subtitle"
            placeholder="e.g. Powerful. Portable. Built for what's next."
            value={form.subtitle ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
            hint="Optional supporting text shown below the headline."
          />

          <Input
            label="CTA Button Label"
            placeholder="Shop Now"
            value={form.ctaText ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, ctaText: e.target.value }))}
            hint="The button always navigates to the Shop page."
          />

          <Input
            label="Sort Order"
            type="number"
            value={String(form.sortOrder)}
            onChange={(e) =>
              setForm((f) => ({ ...f, sortOrder: parseInt(e.target.value, 10) || 0 }))
            }
            hint="Lower numbers appear first."
            error={formErrors.sortOrder}
          />

          {/* Active toggle */}
          <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
            <div>
              <p className="text-body-sm font-medium text-foreground">Active</p>
              <p className="text-caption text-foreground-muted">
                Only active slides are shown on the storefront.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={form.isActive}
              onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}
              className={cn(
                "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent",
                "transition-colors duration-200 ease-in-out",
                "focus-visible:outline-2 focus-visible:outline-focus",
                form.isActive ? "bg-primary" : "bg-muted",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "pointer-events-none inline-block h-4 w-4 rounded-full bg-background shadow",
                  "transform transition-transform duration-200 ease-in-out",
                  form.isActive ? "translate-x-4" : "translate-x-0",
                )}
              />
            </button>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave} loading={saving}>
              {editTarget ? "Save Changes" : "Create Slide"}
            </Button>
          </div>
        </div>
      </AdminDialog>

      {/* Delete confirm dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete slide"
        description={`Delete "${deleteTarget?.title ?? "this slide"}"? This action cannot be undone and the image will be removed from storage.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        loading={deleting}
      />
    </>
  );
}
