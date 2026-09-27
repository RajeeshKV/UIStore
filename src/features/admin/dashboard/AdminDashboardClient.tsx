"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Package,
  ShoppingCart,
  Tag,
  Bookmark,
  TrendingUp,
  Clock,
  AlertCircle,
} from "lucide-react";
import { adminProductsApi } from "@/services/api/admin";
import { adminOrdersApi } from "@/services/api/admin";
import { adminCategoriesApi } from "@/services/api/admin";
import { adminBrandsApi } from "@/services/api/admin";
import { AdminPageHeader } from "@/features/admin/AdminPageHeader";
import { AdminStatusBadge } from "@/features/admin/AdminStatusBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { formatPrice } from "@/lib/utils";
import type { OrderSummaryResponse, ProductSummaryResponse } from "@/types/api";

// ── Stat card ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  href: string;
  loading?: boolean;
}

function StatCard({ label, value, icon, href, loading }: StatCardProps) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 rounded-lg border border-border bg-background p-5 hover:border-border-strong transition-colors"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-primary">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-caption text-foreground-muted">{label}</p>
        {loading ? (
          <Skeleton className="mt-1 h-6 w-16" />
        ) : (
          <p className="text-h4 font-bold text-foreground">{value}</p>
        )}
      </div>
    </Link>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

interface DashboardData {
  productCount: number;
  orderCount: number;
  categoryCount: number;
  brandCount: number;
  recentOrders: OrderSummaryResponse[];
  recentProducts: ProductSummaryResponse[];
}

export function AdminDashboardClient() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [productsRes, ordersRes, categoriesRes, brandsRes] =
        await Promise.allSettled([
          adminProductsApi.list({ page: 1, pageSize: 5, sortBy: "updatedAt", sortOrder: "desc" }),
          adminOrdersApi.list({ page: 1, pageSize: 5 }),
          adminCategoriesApi.list(),
          adminBrandsApi.list(),
        ]);

      const products =
        productsRes.status === "fulfilled" && productsRes.value.ok
          ? productsRes.value.data
          : null;
      const orders =
        ordersRes.status === "fulfilled" && ordersRes.value.ok
          ? ordersRes.value.data
          : null;
      const categories =
        categoriesRes.status === "fulfilled" && categoriesRes.value.ok
          ? categoriesRes.value.data
          : null;
      const brands =
        brandsRes.status === "fulfilled" && brandsRes.value.ok
          ? brandsRes.value.data
          : null;

      setData({
        productCount: products?.totalCount ?? 0,
        orderCount: orders?.totalCount ?? 0,
        categoryCount: categories?.length ?? 0,
        brandCount: brands?.length ?? 0,
        recentOrders: orders?.items ?? [],
        recentProducts: products?.items ?? [],
      });
    } catch {
      setError("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) {
    return <ErrorState title="Dashboard error" description={error} onRetry={load} />;
  }

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader
        title="Dashboard"
        description="Overview of your store."
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Products"
          value={data?.productCount ?? "—"}
          icon={<Package className="size-5" />}
          href="/admin/products"
          loading={loading}
        />
        <StatCard
          label="Orders"
          value={data?.orderCount ?? "—"}
          icon={<ShoppingCart className="size-5" />}
          href="/admin/orders"
          loading={loading}
        />
        <StatCard
          label="Categories"
          value={data?.categoryCount ?? "—"}
          icon={<Tag className="size-5" />}
          href="/admin/categories"
          loading={loading}
        />
        <StatCard
          label="Brands"
          value={data?.brandCount ?? "—"}
          icon={<Bookmark className="size-5" />}
          href="/admin/brands"
          loading={loading}
        />
      </div>

      {/* Recent orders + recent products */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent orders */}
        <section className="rounded-lg border border-border bg-background overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="text-body font-semibold text-foreground flex items-center gap-2">
              <Clock className="size-4 text-foreground-muted" />
              Recent Orders
            </h2>
            <Link
              href="/admin/orders"
              className="text-body-sm text-foreground-muted hover:text-foreground transition-colors"
            >
              View all
            </Link>
          </div>
          <div className="divide-y divide-border">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16 ml-auto" />
                </div>
              ))
            ) : data?.recentOrders.length === 0 ? (
              <div className="flex items-center gap-2 px-5 py-6 text-foreground-muted text-body-sm">
                <AlertCircle className="size-4" />
                No orders yet
              </div>
            ) : (
              data?.recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-surface transition-colors"
                >
                  <div>
                    <p className="text-body-sm font-medium text-foreground">
                      #{order.orderNumber ?? order.id.slice(0, 8)}
                    </p>
                    <p className="text-caption text-foreground-muted">
                      {new Date(order.createdAtUtc).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-body-sm font-medium text-foreground">
                      {formatPrice(order.grandTotal, order.currency ?? "INR")}
                    </span>
                    <AdminStatusBadge status={order.status ?? "pending"} label={order.status} />
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>

        {/* Recent products */}
        <section className="rounded-lg border border-border bg-background overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="text-body font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="size-4 text-foreground-muted" />
              Recent Products
            </h2>
            <Link
              href="/admin/products"
              className="text-body-sm text-foreground-muted hover:text-foreground transition-colors"
            >
              View all
            </Link>
          </div>
          <div className="divide-y divide-border">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3">
                  <Skeleton className="h-8 w-8 rounded" />
                  <div className="flex flex-col gap-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))
            ) : data?.recentProducts.length === 0 ? (
              <div className="flex items-center gap-2 px-5 py-6 text-foreground-muted text-body-sm">
                <AlertCircle className="size-4" />
                No products yet
              </div>
            ) : (
              data?.recentProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/admin/products/${product.id}`}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-surface transition-colors"
                >
                  {product.primaryImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.primaryImageUrl}
                      alt={product.name ?? "Product"}
                      className="h-8 w-8 rounded object-cover bg-surface shrink-0"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded bg-muted flex items-center justify-center shrink-0">
                      <Package className="size-3.5 text-foreground-muted" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-body-sm font-medium text-foreground truncate">
                      {product.name}
                    </p>
                    <p className="text-caption text-foreground-muted">
                      {formatPrice(product.price, "INR")}
                    </p>
                  </div>
                  <AdminStatusBadge status={product.status ?? "draft"} label={product.status} />
                </Link>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
