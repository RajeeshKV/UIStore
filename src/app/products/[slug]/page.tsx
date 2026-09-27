import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StorefrontLayout } from "@/components/layout";
import { storeApi } from "@/services/api/store";
import { CatalogBreadcrumb } from "@/features/catalog/CatalogBreadcrumb";
import { ProductGallery, ProductGalleryFallback } from "@/features/product/ProductGallery";
import { ProductInformation } from "@/features/product/ProductInformation";
import { RelatedProducts } from "@/features/product/RelatedProducts";
import { env } from "@/config/env";

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

  const storeName = settings?.businessName ?? "Kromic Store";
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

  const settings =
    settingsRes.status === "fulfilled" && settingsRes.value.ok
      ? settingsRes.value.data
      : null;

  const policies =
    policiesRes.status === "fulfilled" && policiesRes.value.ok
      ? policiesRes.value.data
      : [];

  // 404 if product not found or API errored
  const productVal = productRes.status === "fulfilled" ? productRes.value : null;
  if (!productVal?.ok) notFound();
  const product = productVal.data;

  const relatedVal = relatedRes.status === "fulfilled" ? relatedRes.value : null;
  const related = relatedVal?.ok ? relatedVal.data : [];

  const currency = settings?.currencyCode ?? product.currency ?? "INR";
  const locale = settings?.culture ?? "en-IN";

  // Build gallery images — use images array if available, fall back to primaryImageUrl
  const galleryImages = product.images ?? [];

  const breadcrumbs = [
    { label: "Home", href: "/" },
    ...(product.categoryName && product.categorySlug
      ? [{ label: product.categoryName, href: `/categories/${product.categorySlug}` }]
      : [{ label: "Shop", href: "/shop" }]),
    { label: product.name ?? product.slug ?? "Product" },
  ];

  return (
    <StorefrontLayout settings={settings} policies={policies}>
      <div className="bg-background">
        {/* Breadcrumb */}
        <div className="container-x mx-auto pt-6 pb-0">
          <CatalogBreadcrumb items={breadcrumbs} />
        </div>

        {/* Main product section */}
        <div className="container-x mx-auto py-8 md:py-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
            {/* Gallery */}
            <div className="lg:sticky lg:top-24">
              {galleryImages.length > 0 ? (
                <ProductGallery
                  images={galleryImages}
                  productName={product.name ?? "Product"}
                />
              ) : (
                <ProductGalleryFallback
                  imageUrl={product.primaryImageUrl}
                  productName={product.name ?? "Product"}
                />
              )}
            </div>

            {/* Info panel */}
            <ProductInformation
              product={product}
              currency={currency}
              locale={locale}
            />
          </div>
        </div>

        {/* Related products */}
        <RelatedProducts
          products={related}
          currency={currency}
          locale={locale}
        />
      </div>
    </StorefrontLayout>
  );
}
