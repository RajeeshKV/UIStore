import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StorefrontLayout } from "@/components/layout";
import { storeApi } from "@/services/api/store";
import { CatalogBreadcrumb } from "@/features/catalog/CatalogBreadcrumb";
import { safeData } from "@/lib/utils";
import { ProductDetailIsland } from "@/features/product/ProductDetailIsland";
import { RelatedProducts } from "@/features/product/RelatedProducts";
import { ProductReviews } from "@/features/reviews/ProductReviews";
import { env } from "@/config/env";

export const dynamic = "force-dynamic";

// Next.js 16: params is a Promise
interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;

  const [productRes, settingsRes] = await Promise.allSettled([
    storeApi.getProductBySlug(slug),
    storeApi.getSettings(),
  ]);

  const product =
    productRes.status === "fulfilled" && productRes.value.ok
      ? productRes.value.data
      : null;

  const settings =
    settingsRes.status === "fulfilled" && settingsRes.value.ok
      ? settingsRes.value.data
      : null;

  if (!product) return { title: "Product Not Found" };

  const storeName = settings?.businessName ?? "Shopey";
  const title = product.metaTitle ?? `${product.name} — ${storeName}`;
  const description =
    product.metaDescription ??
    product.shortDescription ??
    `${product.name} available at ${storeName}.`;

  const primaryImage =
    product.images?.find((i) => i.isPrimary)?.url ?? product.primaryImageUrl;

  const appUrl = env.appUrl;

  return {
    title,
    description,
    keywords: product.metaKeywords,
    openGraph: {
      title,
      description,
      type: "website",
      url: `${appUrl}/products/${slug}`,
      images: primaryImage ? [{ url: primaryImage, alt: product.name }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: primaryImage ? [primaryImage] : [],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;

  const [settingsRes, policiesRes, productRes, relatedRes] =
    await Promise.allSettled([
      storeApi.getSettings(),
      storeApi.getPolicies(),
      storeApi.getProductBySlug(slug),
      storeApi.getRelatedProducts(slug),
    ]);

  const settings = safeData(settingsRes, null);
  const policies = safeData(policiesRes, []);

  // 404 if product not found or API errored
  const productVal = productRes.status === "fulfilled" ? productRes.value : null;
  if (!productVal?.ok) notFound();
  const product = productVal.data;

  const related = safeData(relatedRes, []);

  const currency = settings?.currencyCode ?? product.currency ?? "INR";
  const locale = settings?.culture ?? "en-IN";
  // Mirrors checkout/page.tsx — backend is the authority on COD availability
  const codEnabled = settings?.payment?.codEnabled ?? settings?.delivery?.codEnabled ?? false;

  const breadcrumbs = [
    { label: "Home", href: "/" },
    ...(product.categoryName && product.categorySlug
      ? [{ label: product.categoryName, href: `/categories/${product.categorySlug}` }]
      : [{ label: "Shop", href: "/shop" }]),
    { label: product.name ?? product.slug ?? "Product" },
  ];

  return (
    <StorefrontLayout settings={settings} policies={policies}>
      <div className="bg-white">
        {/* Breadcrumb */}
        <div className="px-5 md:px-8 lg:px-10 pt-6 pb-0">
          <CatalogBreadcrumb items={breadcrumbs} />
        </div>

        {/* Main product section — island owns variant state + image switching */}
        <div className="px-5 md:px-8 lg:px-10 py-8 md:py-10">
          <ProductDetailIsland
            product={product}
            currency={currency}
            locale={locale}
            codEnabled={codEnabled}
          />
        </div>

        {/* Related products */}
        <RelatedProducts
          products={related}
          currency={currency}
          locale={locale}
        />

        {/* Customer reviews */}
        <div className="px-5 md:px-8 lg:px-10 pb-16">
          <ProductReviews productId={product.id} productName={product.name ?? "this product"} />
        </div>
      </div>
    </StorefrontLayout>
  );
}
