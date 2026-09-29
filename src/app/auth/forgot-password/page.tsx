import type { Metadata } from "next";
import { Suspense } from "react";
import { StorefrontLayout } from "@/components/layout";
import { storeApi } from "@/services/api/store";
import { ForgotPasswordForm } from "@/features/auth/ForgotPasswordForm";
import { safeData } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Reset Password",
  robots: { index: false, follow: false },
};

export default async function ForgotPasswordPage() {
  const [settingsRes, policiesRes] = await Promise.allSettled([
    storeApi.getSettings(), storeApi.getPolicies(),
  ]);
  const settings = safeData(settingsRes, null);
  const policies = safeData(policiesRes, []);

  return (
    <StorefrontLayout settings={settings} policies={policies}>
      <div className="container-x mx-auto py-16 max-w-md min-h-[70vh]">
        <div className="mb-8">
          <h1 className="text-h2 font-bold text-foreground">Reset password</h1>
          <p className="mt-2 text-body-sm text-foreground-muted">
            Enter your email and we&apos;ll send you reset instructions.
          </p>
        </div>
        <Suspense>
          <ForgotPasswordForm />
        </Suspense>
      </div>
    </StorefrontLayout>
  );
}
