import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { storeApi } from "@/services/api/store";
import { StorefrontLayout } from "@/components/layout";
import { GoogleLoginButton } from "@/features/auth/GoogleLoginButton";
import { safeData } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign In",
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  const [settingsRes, policiesRes] = await Promise.allSettled([
    storeApi.getSettings(),
    storeApi.getPolicies(),
  ]);
  const settings  = safeData(settingsRes, null);
  const policies  = safeData(policiesRes, []);
  const storeName = settings?.businessName ?? "Shopey";

  return (
    <StorefrontLayout settings={settings} policies={policies}>
      <div className="min-h-[80vh] flex items-center justify-center py-16 px-4 bg-[#f8f9fb]">
        <div className="w-full max-w-[400px]">
          {/* Auth card */}
          <div className="bg-white rounded-3xl border border-[#E5E7EB] shadow-[0_8px_32px_rgba(0,0,0,0.06)] px-8 py-10">
            {/* Logo / brand */}
            <div className="mb-8 text-center">
              {settings?.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={settings.logoUrl} alt={storeName} className="h-14 w-auto mx-auto object-contain mb-5" />
              ) : (
                <div className="flex items-center justify-center gap-1.5 mb-5">
                  <span className="font-extrabold text-[24px] tracking-tighter text-[#191c1e] uppercase">{storeName}</span>
                  <span className="w-2 h-2 rounded-full bg-[#ba0918] mb-0.5" aria-hidden="true" />
                </div>
              )}
              <h1 className="text-[22px] font-extrabold text-[#191c1e] tracking-tight">Welcome back</h1>
              <p className="mt-1.5 text-[13px] text-[#444748]">
                Sign in to your account to continue shopping.
              </p>
            </div>

            {/* Google sign-in */}
            <Suspense fallback={
              <div className="h-12 rounded-xl border border-[#E5E7EB] bg-[#f3f4f6] animate-skeleton" />
            }>
              <GoogleLoginButton />
            </Suspense>

            {/* Terms */}
            {policies.length > 0 && (
              <p className="mt-6 text-center text-[11px] text-[#5A6578] leading-relaxed">
                By signing in you agree to our{" "}
                {policies.slice(0, 2).map((p, i) => (
                  <span key={p.id}>
                    {i > 0 && " and "}
                    <Link
                      href={`/policies/${(p.policyType ?? "policy").toLowerCase()}`}
                      className="underline underline-offset-2 hover:text-[#191c1e] transition-colors"
                    >
                      {p.title ?? p.policyType}
                    </Link>
                  </span>
                ))}
                .
              </p>
            )}
          </div>

          {/* Back to store */}
          <div className="mt-6 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-[13px] text-[#444748] hover:text-[#191c1e] transition-colors"
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
