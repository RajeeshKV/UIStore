import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import Script from "next/script";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";
import { StoreProvider } from "@/features/store/StoreContext";
import { storeApi } from "@/services/api/store";
import { ScrollResetter } from "@/components/layout/NavigationEvents";
import { DevThemeSwitcher } from "@/components/dev/ThemeSwitcher";
import { getThemeConfig, getThemeCssVariables, themeCatalog } from "@/theme";
import { getConfiguredStoreTheme } from "@/theme/server";
import type { PublicBusinessSettingsResponse } from "@/types/api";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Shopey",
    template: "%s | Shopey",
  },
  description: "Premium products for a smarter, better tomorrow.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png" },
    ],
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
};

async function getStoreSettings(): Promise<PublicBusinessSettingsResponse | null> {
  const result = await storeApi.getSettings();
  if (result.ok) return result.data;
  return null;
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getStoreSettings();
  const storeTheme = getConfiguredStoreTheme();
  const configuredTheme = getThemeConfig(storeTheme);
  const previewEnabled = process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_THEME_SWITCHER === "true";
  const previewMap = JSON.stringify(Object.fromEntries(themeCatalog.map((item) => [item.id, {
    variables: getThemeCssVariables(item.id), presentation: item.presentation,
  }])));

  return (
    <html
      lang="en"
      data-theme={storeTheme === "default" ? undefined : storeTheme}
      data-theme-header={configuredTheme.presentation.header}
      data-theme-hero={configuredTheme.presentation.hero}
      data-theme-categories={configuredTheme.presentation.categories}
      data-theme-featured={configuredTheme.presentation.featured}
      data-theme-products={configuredTheme.presentation.productCards}
      data-theme-footer={configuredTheme.presentation.footer}
      style={getThemeCssVariables(storeTheme) as React.CSSProperties}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {previewEnabled && (
          <Script id="restore-theme-preview" strategy="beforeInteractive">
            {`(function(){try{var m=${previewMap},t=localStorage.getItem("kromic_dev_theme"),v=m[t],r=document.documentElement;if(!v)return;if(t==="default")r.removeAttribute("data-theme");else r.setAttribute("data-theme",t);Object.keys(v.variables).forEach(function(k){r.style.setProperty(k,v.variables[k])});Object.keys(v.presentation).forEach(function(k){var a={header:"themeHeader",hero:"themeHero",categories:"themeCategories",featured:"themeFeatured",productCards:"themeProducts",footer:"themeFooter"}[k];if(a)r.dataset[a]=v.presentation[k]})}catch(_){}})();`}
          </Script>
        )}
        {/* Skip to main content - accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:text-body-sm"
        >
          Skip to main content
        </a>

        <StoreProvider settings={settings}>
          <ToastProvider>
            <Suspense fallback={null}>
              <ScrollResetter />
            </Suspense>
            {children}
          </ToastProvider>
        </StoreProvider>
        {/* Internal preview control; production storefronts use the fixed server theme. */}
        <DevThemeSwitcher initialTheme={storeTheme} />
      </body>
    </html>
  );
}
