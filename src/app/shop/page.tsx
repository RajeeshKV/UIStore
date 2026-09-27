import type { Metadata } from "next";
import { StorefrontLayout } from "@/components/layout";
import { storeApi } from "@/services/api/store";
import { CatalogShell } from "@/features/catalog/CatalogShell";
import {
  parseCatalogParams,
  catalogParamsToApiParams,
  DEFAULT_PAGE_SIZE,
} from "@/types/catalog";

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
  const storeName = settings?.businessName ?? "Kromic Store";

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
      storeApi.getProducts(catalogParamsToApiParams(params)),
    ]);

  const settings =
    settingsRes.status === "fulfilled" && settingsRes.value.ok
      ? settingsRes.value.data
      : null;

  const policies =
    policiesRes.status === "fulfilled" && policiesRes.value.ok
      ? policiesRes.value.data
      : [];

  const categoriesVal =
    categoriesRes.status === "fulfilled" ? categoriesRes.value : null;
  const categories = categoriesVal?.ok ? categoriesVal.data : [];

  const brandsVal =
    brandsRes.status === "fulfilled" ? brandsRes.value : null;
  const brands = brandsVal?.ok ? brandsVal.data : [];

  const productsVal =
    productsRes.status === "fulfilled" ? productsRes.value : null;
  const productsData = productsVal?.ok ? productsVal.data : null;

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
