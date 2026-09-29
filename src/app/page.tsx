import type { Metadata } from "next";
import { StorefrontLayout } from "@/components/layout";
import { storeApi } from "@/services/api/store";
import { StoreClosedBanner } from "@/features/store/StoreClosedBanner";
import { HeroSection } from "@/features/storefront/HeroSection";
import { TrustBar } from "@/features/storefront/TrustBar";
import { CategoryShowcase } from "@/features/storefront/CategoryShowcase";
import { FeaturedProducts } from "@/features/storefront/FeaturedProducts";
import { BrandShowcase } from "@/features/storefront/BrandShowcase";
import { EditorialBanner } from "@/features/storefront/EditorialBanner";
import { NewArrivals } from "@/features/storefront/NewArrivals";
import { safeData } from "@/lib/utils";
import type {
  PublicBusinessSettingsResponse,
  StorePolicyResponse,
  StorefrontCategoryResponse,
  StorefrontProductSummaryResponse,
  StorefrontBrandResponse,
} from "@/types/api";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const result = await storeApi.getSettings();
  const settings = result.ok ? result.data : null;
  const title = settings?.seo?.metaTitle ?? settings?.businessName ?? "Kromic Store";
  const description = settings?.seo?.metaDescription ?? "Premium products for a more beautiful everyday life.";
  return {
    title,
    description,
    openGraph: { title, description, type: "website", url: process.env.NEXT_PUBLIC_APP_URL },
  };
}

interface HomePageData {
  settings: PublicBusinessSettingsResponse | null;
  policies: StorePolicyResponse[];
  categories: StorefrontCategoryResponse[];
  brands: StorefrontBrandResponse[];
  featuredProducts: StorefrontProductSummaryResponse[];
  newArrivals: StorefrontProductSummaryResponse[];
}

async function getHomePageData(): Promise<HomePageData> {
  const [settingsRes, policiesRes, categoriesRes, featuredRes, brandsRes] =
    await Promise.allSettled([
      storeApi.getSettings(),
      storeApi.getPolicies(),
      storeApi.getCategories(),
      storeApi.getFeatured(),
      storeApi.getBrands(),
    ]);

  const settings = safeData(settingsRes, null);
  const policies = safeData(policiesRes, []);
  const categories = safeData(categoriesRes, []);
  const featuredProducts = safeData(featuredRes, []);
  // Brands: silently empty on failure — optional section
  const brands = safeData(brandsRes, []);

  return {
    settings,
    policies,
    categories,
    brands,
    featuredProducts,
    newArrivals: featuredProducts.slice(0, 6),
  };
}

export default async function HomePage() {
  const data = await getHomePageData();
  const currency = data.settings?.currencyCode ?? "INR";
  const locale = data.settings?.culture ?? "en-IN";

  return (
    <StorefrontLayout settings={data.settings} policies={data.policies}>
      {data.settings && !data.settings.isStoreOpen && (
        <StoreClosedBanner message={data.settings.temporaryClosureMessage} />
      )}

      {/* 1. Hero */}
      <HeroSection storeName={data.settings?.businessName} />

      {/* 2. Trust bar */}
      <TrustBar settings={data.settings} />

      {/* 3. Categories — compact grid */}
      <CategoryShowcase categories={data.categories} />

      {/* 4. Featured products — 5-6 col compact grid */}
      <FeaturedProducts products={data.featuredProducts} currency={currency} locale={locale} />

      {/* 5. Brands — only when brands are configured and active */}
      <BrandShowcase brands={data.brands} />

      {/* 6. Editorial break */}
      <EditorialBanner />

      {/* 7. New arrivals */}
      <NewArrivals products={data.newArrivals} currency={currency} locale={locale} />
    </StorefrontLayout>
  );
}
