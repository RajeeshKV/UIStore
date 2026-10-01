"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Plus, Search, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { adminProductsApi } from "@/services/api/admin";
import { AdminPageHeader } from "@/features/admin/AdminPageHeader";
import { AdminTable, type Column } from "@/features/admin/AdminTable";
import { AdminStatusBadge } from "@/features/admin/AdminStatusBadge";
import { ConfirmDialog } from "@/features/admin/AdminDialog";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { formatPrice, cn } from "@/lib/utils";
import type { ProductSummaryResponse } from "@/types/api";

const PAGE_SIZE = 20;

export function AdminProductsClient() {
  const [products, setProducts] = useState<ProductSummaryResponse[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Action state
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<ProductSummaryResponse | null>(null);
  const [archiving, setArchiving] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await adminProductsApi.list({
      page,
      pageSize: PAGE_SIZE,
      search: debouncedSearch || undefined,
    });
    if (res.ok) {
      setProducts(res.data.items);
      setTotalCount(res.data.totalCount);
      setTotalPages(res.data.totalPages);
    } else {
      setError(
        res.error && "message" in res.error
          ? res.error.message
          : "Failed to load products.",
      );
    }
    setLoading(false);
  }, [page, debouncedSearch]);

  useEffect(() => { void load(); }, [load]);

  async function handlePublish(product: ProductSummaryResponse) {
    setPublishingId(product.id);
    const fn =
      product.status === "Published"
        ? adminProductsApi.unpublish
        : adminProductsApi.publish;
    const res = await fn(product.id);
    setPublishingId(null);
    if (res.ok) {
      setToastMsg(product.status === "Published" ? "Product unpublished." : "Product published.");
      void load();
    } else {
      setToastMsg("Action failed. Please try again.");
    }
    setTimeout(() => setToastMsg(""), 3000);
  }

  async function handleArchive() {
    if (!archiveTarget) return;
    setArchiving(true);
    const res = await adminProductsApi.archive(archiveTarget.id);
    setArchiving(false);
    setArchiveTarget(null);
    if (res.ok) {
      setToastMsg("Product archived.");
      void load();
    } else {
      setToastMsg("Archive failed. Please try again.");
    }
    setTimeout(() => setToastMsg(""), 3000);
  }

  const columns: Column<ProductSummaryResponse>[] = [
    {
      key: "product",
      header: "Product",
      render: (row) => (
        <div className="flex items-center gap-3 min-w-0">
          {row.primaryImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={row.primaryImageUrl}
              alt={row.name ?? ""}
              className="h-9 w-9 rounded object-cover bg-surface shrink-0"
            />
          ) : (
            <div className="h-9 w-9 rounded bg-muted shrink-0" />
          )}
          <div className="min-w-0">
            <p className="text-body-sm font-medium text-foreground truncate max-w-[200px]">
              {row.name}
            </p>
            <p className="text-caption text-foreground-muted">{row.sku ?? "—"}</p>
          </div>
        </div>
      ),
    },
    {
      key: "price",
      header: "Price",
      className: "whitespace-nowrap",
      render: (row) => (
        <span className="text-body-sm text-foreground">{formatPrice(row.price, "INR")}</span>
      ),
    },
    {
      key: "category",
      header: "Category",
      render: (row) => (
        <span className="text-body-sm text-foreground-muted truncate">{row.categoryName ?? "—"}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <AdminStatusBadge status={row.status ?? "Draft"} />,
    },
    {
      key: "stock",
      header: "Stock",
      render: (row) => {
        if (!row.isAvailable) {
          return (
            <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold bg-danger/10 text-danger">
              Out of stock
            </span>
          );
        }
        return (
          <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold bg-success/10 text-success">
            In stock
          </span>
        );
      },
    },
    {
      key: "featured",
      header: "Featured",
      render: (row) => (
        <span className={cn("text-body-sm", row.isFeatured ? "text-success" : "text-foreground-muted")}>
          {row.isFeatured ? "Yes" : "No"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      // Wide enough for all three inline actions
      className: "w-44",
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          {/* Edit — icon */}
          <Link
            href={`/admin/products/${row.id}`}
            aria-label="Edit product"
            className="flex h-7 w-7 items-center justify-center rounded text-foreground-muted hover:bg-muted hover:text-foreground transition-colors"
          >
            <Pencil className="size-3.5" />
          </Link>

          {/* Publish / Unpublish — text button (prominent) */}
          <button
            onClick={() => handlePublish(row)}
            disabled={publishingId === row.id}
            className={cn(
              "flex items-center gap-1 h-7 px-2.5 rounded text-body-sm font-medium transition-colors",
              row.status === "Published"
                ? "text-foreground-muted hover:bg-muted hover:text-foreground"
                : "text-primary hover:bg-primary/10",
              publishingId === row.id && "opacity-50 pointer-events-none",
            )}
          >
            {row.status === "Published" ? (
              <><EyeOff className="size-3.5" /> Unpublish</>
            ) : (
              <><Eye className="size-3.5" /> Publish</>
            )}
          </button>

          {/* Archive — icon (danger) */}
          <button
            aria-label="Archive product"
            onClick={() => setArchiveTarget(row)}
            className="flex h-7 w-7 items-center justify-center rounded text-foreground-muted hover:bg-danger/10 hover:text-danger transition-colors"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-4 right-4 z-50 rounded-lg border border-border bg-background shadow-md px-4 py-3 text-body-sm text-foreground">
          {toastMsg}
        </div>
      )}

      <div className="flex flex-col gap-6">
        <AdminPageHeader
          title="Products"
          description={`${totalCount} product${totalCount !== 1 ? "s" : ""}`}
          action={
            <Link href="/admin/products/new">
              <Button variant="primary" size="sm">
                <Plus className="size-4 mr-1.5" /> New Product
              </Button>
            </Link>
          }
        />

        {/* Search */}
        <div className="flex gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-foreground-muted pointer-events-none" />
            <input
              type="search"
              placeholder="Search products…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search products"
              className="w-full h-9 pl-9 pr-3 rounded-md border border-border bg-background text-body-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-focus"
            />
          </div>
        </div>

        <AdminTable
          columns={columns}
          rows={products}
          rowKey={(r) => r.id}
          loading={loading}
          error={error}
          emptyTitle="No products yet"
          emptyDescription="Create your first product to get started."
          onRetry={load}
        />

        {totalPages > 1 && (
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        )}
      </div>

      <ConfirmDialog
        open={!!archiveTarget}
        onClose={() => setArchiveTarget(null)}
        onConfirm={handleArchive}
        title="Archive product"
        description={`Archive "${archiveTarget?.name}"? It will be hidden from the storefront.`}
        confirmLabel="Archive"
        confirmVariant="danger"
        loading={archiving}
      />
    </>
  );
}
