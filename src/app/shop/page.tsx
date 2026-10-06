import type { Metadata } from "next";
import { StorefrontLayout } from "@/components/layout";
import { storeApi } from "@/services/api/store";
import { CatalogShell } from "@/features/catalog/CatalogShell";
import {
  parseCatalogParams,
  catalogParamsToQueryString,
  DEFAULT_PAGE_SIZE,
} from "@/types/catalog";
import { safeData } from "@/lib/utils";

export const dynamic = "force-dynamic";

// Next.js 16: searchParams is a Promise
interface ShopPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({
  searchParams,
}: ShopPageProps): Promise<Metadata> {
  const sp = await searchParams;
  const search = typeof sp.search === "string" ? sp.search : undefined;

  const settingsResult = await storeApi.getSettings();
  const settings = settingsResult.ok ? settingsResult.data : null;
  const storeName = settings?.businessName ?? "Shopey";

  const title = search
    ? `Search: "${search}" — ${storeName}`
    : `Shop All Products — ${storeName}`;

  return {
    title,
    description: `Browse our full collection of premium products${search ? ` matching "${search}"` : ""}.`,
    robots: { index: !search, follow: true }, // don't index search result pages
  };
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const sp = await searchParams;

  // Convert Record to URLSearchParams
  const urlSp = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (typeof v === "string") urlSp.set(k, v);
    else if (Array.isArray(v)) v.forEach((val) => urlSp.append(k, val));
  }

  const params = parseCatalogParams(urlSp);
  if (!params.PageSize) params.PageSize = DEFAULT_PAGE_SIZE;

  // Parallel data fetch — shop page always fetches all three
  const [settingsRes, policiesRes, categoriesRes, brandsRes, productsRes] =
    await Promise.allSettled([
      storeApi.getSettings(),
      storeApi.getPolicies(),
      storeApi.getCategories(),
      storeApi.getBrands(),
      storeApi.getVariantGrid(catalogParamsToQueryString(params)),
    ]);

  const settings = safeData(settingsRes, null);
  const policies = safeData(policiesRes, []);
  const categories = safeData(categoriesRes, []);
  const brands = safeData(brandsRes, []);
  const productsData = safeData(productsRes, null);

  const currency = settings?.currencyCode ?? "INR";
  const locale = settings?.culture ?? "en-IN";

  return (
    <StorefrontLayout settings={settings} policies={policies}>
      <CatalogShell
        initialProducts={productsData?.items ?? []}
        initialTotalCount={productsData?.totalCount ?? 0}
        initialTotalPages={productsData?.totalPages ?? 0}
        initialParams={params}
        categories={categories}
        brands={brands}
        currency={currency}
        locale={locale}
        baseHref="/shop"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Shop" },
        ]}
        heading="All Products"
      />
    </StorefrontLayout>
  );
}
