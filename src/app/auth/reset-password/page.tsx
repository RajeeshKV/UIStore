import type { Metadata } from "next";
import { Suspense } from "react";
import { StorefrontLayout } from "@/components/layout";
import { storeApi } from "@/services/api/store";
import { ResetPasswordForm } from "@/features/auth/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Set New Password",
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage() {
  const [settingsRes, policiesRes] = await Promise.allSettled([
    storeApi.getSettings(), storeApi.getPolicies(),
  ]);
  const settings = settingsRes.status === "fulfilled" && settingsRes.value.ok ? settingsRes.value.data : null;
  const policies = policiesRes.status === "fulfilled" && policiesRes.value.ok ? policiesRes.value.data : [];

  return (
    <StorefrontLayout settings={settings} policies={policies}>
      <div className="container-x mx-auto py-16 max-w-md min-h-[70vh]">
        <div className="mb-8">
          <h1 className="text-h2 font-bold text-foreground">Set new password</h1>
          <p className="mt-2 text-body-sm text-foreground-muted">
            Enter and confirm your new password.
          </p>
        </div>
        <Suspense>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </StorefrontLayout>
  );
}
