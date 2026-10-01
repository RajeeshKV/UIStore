import type { Metadata } from "next";
import { StorefrontLayout } from "@/components/layout";
import { storeApi } from "@/services/api/store";
import { StoreClosedBanner } from "@/features/store/StoreClosedBanner";
import { HeroCarousel } from "@/features/storefront/HeroCarousel";
import { TrustBar } from "@/features/storefront/TrustBar";
import { CategoryShowcase } from "@/features/storefront/CategoryShowcase";
import { FeaturedProducts } from "@/features/storefront/FeaturedProducts";
import { safeData } from "@/lib/utils";
import type {
  PublicBusinessSettingsResponse,
  StorePolicyResponse,
  StorefrontCategoryResponse,
  StorefrontProductSummaryResponse,
  StorefrontCarouselSlideResponse,
} from "@/types/api";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const result = await storeApi.getSettings();
  const settings = result.ok ? result.data : null;
  const storeName = settings?.businessName ?? "Shopey Store";
  const title = settings?.seo?.metaTitle ?? storeName;
  const description =
    settings?.seo?.metaDescription ??
    "Premium products for a smarter, better tomorrow.";
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: process.env.NEXT_PUBLIC_APP_URL,
    },
  };
}

interface HomePageData {
  settings: PublicBusinessSettingsResponse | null;
  policies: StorePolicyResponse[];
  categories: StorefrontCategoryResponse[];
  featuredProducts: StorefrontProductSummaryResponse[];
  carouselSlides: StorefrontCarouselSlideResponse[];
}

async function getHomePageData(): Promise<HomePageData> {
  const [settingsRes, policiesRes, categoriesRes, featuredRes, carouselRes] =
    await Promise.allSettled([
      storeApi.getSettings(),
      storeApi.getPolicies(),
      storeApi.getCategories(),
      storeApi.getFeatured(),
      storeApi.getCarousel(),
    ]);

  return {
    settings: safeData(settingsRes, null),
    policies: safeData(policiesRes, []),
    categories: safeData(categoriesRes, []),
    featuredProducts: safeData(featuredRes, []),
    // Empty array = carousel uses placeholder slides
    carouselSlides: safeData(carouselRes, []),
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

      {/* 1. Hero carousel */}
      <HeroCarousel slides={data.carouselSlides} />

      {/* 2. Trust bar */}
      <TrustBar settings={data.settings} />

      {/* 3. Shop by Category */}
      <CategoryShowcase categories={data.categories} />

      {/* 4. Featured Products */}
      <FeaturedProducts
        products={data.featuredProducts}
        currency={currency}
        locale={locale}
      />
    </StorefrontLayout>
  );
}
