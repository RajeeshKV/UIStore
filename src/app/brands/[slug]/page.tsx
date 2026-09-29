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

interface BrandPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({
  params,
}: BrandPageProps): Promise<Metadata> {
  const { slug } = await params;
  const [brandRes, settingsRes] = await Promise.allSettled([
    storeApi.getBrandBySlug(slug),
    storeApi.getSettings(),
  ]);

  const brand =
    brandRes.status === "fulfilled" && brandRes.value.ok
      ? brandRes.value.data
      : null;
  const settings =
    settingsRes.status === "fulfilled" && settingsRes.value.ok
      ? settingsRes.value.data
      : null;

  if (!brand) return { title: "Brand Not Found" };

  const storeName = settings?.businessName ?? "Kromic Store";
  const title = `${brand.name} — ${storeName}`;
  const description =
    brand.description ??
    `Shop ${brand.name} products${brand.productCount ? ` — ${brand.productCount} items` : ""}.`;

  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
  };
}

export default async function BrandPage({
  params,
  searchParams,
}: BrandPageProps) {
  const { slug } = await params;
  const sp = await searchParams;

  const urlSp = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (typeof v === "string") urlSp.set(k, v);
    else if (Array.isArray(v)) v.forEach((val) => urlSp.append(k, val));
  }

  const catalogParams = parseCatalogParams(urlSp);
  if (!catalogParams.PageSize) catalogParams.PageSize = DEFAULT_PAGE_SIZE;
  catalogParams.BrandSlug = slug;

  const [settingsRes, policiesRes, brandRes, categoriesRes, productsRes] =
    await Promise.allSettled([
      storeApi.getSettings(),
      storeApi.getPolicies(),
      storeApi.getBrandBySlug(slug),
      storeApi.getCategories(),
      storeApi.getProducts(catalogParamsToApiParams(catalogParams)),
    ]);

  const settings = safeData(settingsRes, null);
  const policies = safeData(policiesRes, []);

  const brandVal = brandRes.status === "fulfilled" ? brandRes.value : null;
  if (!brandVal?.ok) notFound();
  const brand = brandVal.data;

  const categories = safeData(categoriesRes, []);
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
        categories={categories}
        brands={[]}
        currency={currency}
        locale={locale}
        baseHref={`/brands/${slug}`}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Brands", href: "/brands" },
          { label: brand.name ?? brand.id },
        ]}
        heading={brand.name}
        description={brand.description}
        lockedBrand={slug}
      />
    </StorefrontLayout>
  );
}
