import type { Metadata } from "next";
import { StorefrontLayout } from "@/components/layout";
import { storeApi } from "@/services/api/store";
import { StoreClosedBanner } from "@/features/store/StoreClosedBanner";
import { HeroSection } from "@/features/storefront/HeroSection";
import { TrustBar } from "@/features/storefront/TrustBar";
import { CategoryShowcase } from "@/features/storefront/CategoryShowcase";
import { FeaturedProducts } from "@/features/storefront/FeaturedProducts";
import { EditorialBanner } from "@/features/storefront/EditorialBanner";
import { NewArrivals } from "@/features/storefront/NewArrivals";
import { safeData } from "@/lib/utils";
import type {
  PublicBusinessSettingsResponse,
  StorePolicyResponse,
  StorefrontCategoryResponse,
  StorefrontProductSummaryResponse,
} from "@/types/api";

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata(): Promise<Metadata> {
  const result = await storeApi.getSettings();
  const settings = result.ok ? result.data : null;

  const title = settings?.seo?.metaTitle ?? settings?.businessName ?? "Kromic Store";
  const description =
    settings?.seo?.metaDescription ??
    "Premium products for a more beautiful everyday life.";

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

// ── Data fetching ─────────────────────────────────────────────────────────────

interface HomePageData {
  settings: PublicBusinessSettingsResponse | null;
  policies: StorePolicyResponse[];
  categories: StorefrontCategoryResponse[];
  categoriesError: boolean;
  featuredProducts: StorefrontProductSummaryResponse[];
  featuredError: boolean;
  newArrivals: StorefrontProductSummaryResponse[];
  newArrivalsError: boolean;
}

async function getHomePageData(): Promise<HomePageData> {
  const [settingsRes, policiesRes, categoriesRes, featuredRes] =
    await Promise.allSettled([
      storeApi.getSettings(),
      storeApi.getPolicies(),
      storeApi.getCategories(),
      storeApi.getFeatured(),
    ]);

  const settings = safeData(settingsRes, null);
  const policies = safeData(policiesRes, []);
  const categories = safeData(categoriesRes, []);
  const categoriesError = false;

  const featuredProducts = safeData(featuredRes, []);
  const featuredError = false;

  return {
    settings,
    policies,
    categories,
    categoriesError,
    featuredProducts,
    featuredError,
    // New arrivals: backend returns a flat list; use same data for now.
    // A dedicated /store/products?sort=newest endpoint is used in Phase 3 catalog.
    newArrivals: featuredProducts.slice(0, 4),
    newArrivalsError: featuredError,
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const data = await getHomePageData();

  const currency = data.settings?.currencyCode ?? "INR";
  const locale = data.settings?.culture ?? "en-IN";

  return (
    <StorefrontLayout settings={data.settings} policies={data.policies}>
      {/* Store temporarily closed notice */}
      {data.settings && !data.settings.isStoreOpen && (
        <StoreClosedBanner message={data.settings.temporaryClosureMessage} />
      )}

      {/* 1. Hero */}
      <HeroSection storeName={data.settings?.businessName} />

      {/* 2. Trust / service benefits */}
      <TrustBar settings={data.settings} />

      {/* 3. Category showcase */}
      <CategoryShowcase
        categories={data.categories}
        error={data.categoriesError}
      />

      {/* 4. Featured products */}
      <FeaturedProducts
        products={data.featuredProducts}
        error={data.featuredError}
        currency={currency}
        locale={locale}
      />

      {/* 5. Editorial / promotional break */}
      <EditorialBanner />

      {/* 6. New arrivals */}
      <NewArrivals
        products={data.newArrivals}
        error={data.newArrivalsError}
        currency={currency}
        locale={locale}
      />
    </StorefrontLayout>
  );
}
