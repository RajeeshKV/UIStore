import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StorefrontLayout } from "@/components/layout";
import { storeApi } from "@/services/api/store";
import { CatalogShell } from "@/features/catalog/CatalogShell";
import {
  parseCatalogParams,
  catalogParamsToApiParams,
  DEFAULT_PAGE_SIZE,
} from "@/types/catalog";
import { safeData } from "@/lib/utils";

export const dynamic = "force-dynamic";

// Next.js 16: both params and searchParams are Promises
interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const [catRes, settingsRes] = await Promise.allSettled([
    storeApi.getCategoryBySlug(slug),
    storeApi.getSettings(),
  ]);

  const cat =
    catRes.status === "fulfilled" && catRes.value.ok ? catRes.value.data : null;
  const settings =
    settingsRes.status === "fulfilled" && settingsRes.value.ok
      ? settingsRes.value.data
      : null;

  if (!cat) {
    return { title: "Category Not Found" };
  }

  const storeName = settings?.businessName ?? "Kromic Store";
  const title = `${cat.name} — ${storeName}`;
  const description =
    cat.description ??
    `Shop ${cat.name} products${cat.productCount ? ` — ${cat.productCount} items` : ""}.`;

  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const { slug } = await params;
  const sp = await searchParams;

  // Convert to URLSearchParams
  const urlSp = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (typeof v === "string") urlSp.set(k, v);
    else if (Array.isArray(v)) v.forEach((val) => urlSp.append(k, val));
  }

  const catalogParams = parseCatalogParams(urlSp);
  if (!catalogParams.PageSize) catalogParams.PageSize = DEFAULT_PAGE_SIZE;
  // Lock the category
  catalogParams.CategorySlug = slug;

  const [settingsRes, policiesRes, catRes, brandsRes, productsRes] =
    await Promise.allSettled([
      storeApi.getSettings(),
      storeApi.getPolicies(),
      storeApi.getCategoryBySlug(slug),
      storeApi.getBrands(),
      storeApi.getProducts(catalogParamsToApiParams(catalogParams)),
    ]);

  const settings = safeData(settingsRes, null);
  const policies = safeData(policiesRes, []);

  // 404 if category not found
  const catVal = catRes.status === "fulfilled" ? catRes.value : null;
  if (!catVal?.ok) notFound();
  const category = catVal.data;

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
        initialParams={catalogParams}
        categories={[]}
        brands={brands}
        currency={currency}
        locale={locale}
        baseHref={`/categories/${slug}`}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Categories", href: "/categories" },
          { label: category.name ?? category.id },
        ]}
        heading={category.name}
        description={category.description}
        lockedCategory={slug}
      />
    </StorefrontLayout>
  );
}
