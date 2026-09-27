import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { storeApi } from "@/services/api/store";
import { StorefrontLayout } from "@/components/layout";
import { GoogleLoginButton } from "@/features/auth/GoogleLoginButton";

export const metadata: Metadata = {
  title: "Sign In",
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  const [settingsRes, policiesRes] = await Promise.allSettled([
    storeApi.getSettings(),
    storeApi.getPolicies(),
  ]);
  const settings =
    settingsRes.status === "fulfilled" && settingsRes.value.ok
      ? settingsRes.value.data
      : null;
  const policies =
    policiesRes.status === "fulfilled" && policiesRes.value.ok
      ? policiesRes.value.data
      : [];

  const storeName = settings?.businessName ?? "Kromic Store";

  // Inject the Google client_id from store integration settings if available
  // (The backend may expose it via the Google integration public fields)
  // For now it is read by GoogleLoginButton from NEXT_PUBLIC_GOOGLE_CLIENT_ID or a meta tag

  return (
    <StorefrontLayout settings={settings} policies={policies}>
      <div className="min-h-[80vh] flex items-center justify-center py-16 px-4">
        <div className="w-full max-w-sm">
          {/* Logo / brand */}
          <div className="mb-8 text-center">
            {settings?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={settings.logoUrl}
                alt={storeName}
                className="h-20 w-auto mx-auto object-contain mb-4"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src="/logo-large.png"
                alt={storeName}
                className="h-20 w-auto mx-auto object-contain mb-4"
              />
            )}
            <h1 className="text-h2 font-bold text-foreground">Welcome back</h1>
            <p className="mt-2 text-body-sm text-foreground-muted">
              Sign in to your account to continue shopping.
            </p>
          </div>

          {/* Google sign-in */}
          <Suspense fallback={
            <div className="h-12 rounded-md border border-border bg-surface animate-skeleton" />
          }>
            <GoogleLoginButton />
          </Suspense>

          {/* Terms / Privacy */}
          {policies.length > 0 && (
            <p className="mt-6 text-center text-caption text-foreground-muted">
              By signing in you agree to our{" "}
              {policies.slice(0, 2).map((p, i) => (
                <span key={p.id}>
                  {i > 0 && " and "}
                  <Link
                    href={`/policies/${(p.policyType ?? "policy").toLowerCase()}`}
                    className="underline underline-offset-2 hover:text-foreground transition-colors"
                  >
                    {p.title ?? p.policyType}
                  </Link>
                </span>
              ))}
              .
            </p>
          )}

          {/* Back to store */}
          <div className="mt-6 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-body-sm text-foreground-muted hover:text-foreground transition-colors"
            >
              <ArrowLeft className="size-3.5" aria-hidden="true" />
              Back to store
            </Link>
          </div>
        </div>
      </div>
    </StorefrontLayout>
  );
}
