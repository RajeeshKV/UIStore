import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";
import { StoreProvider } from "@/features/store/StoreContext";
import { storeApi } from "@/services/api/store";
import { ScrollResetter } from "@/components/layout/NavigationEvents";
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
    default: "Kromic Store",
    template: "%s | Kromic Store",
  },
  description: "Premium products for a more beautiful everyday life.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
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

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {/* Skip to main content — accessibility */}
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
      </body>
    </html>
  );
}
