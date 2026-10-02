import type { Metadata } from "next";
import { Suspense } from "react";
import { StorefrontLayout } from "@/components/layout";
import { storeApi } from "@/services/api/store";
import { ResetPasswordForm } from "@/features/auth/ResetPasswordForm";
import { safeData } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Set New Password",
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage() {
  const [settingsRes, policiesRes] = await Promise.allSettled([
    storeApi.getSettings(), storeApi.getPolicies(),
  ]);
  const settings = safeData(settingsRes, null);
  const policies = safeData(policiesRes, []);

  return (
    <StorefrontLayout settings={settings} policies={policies}>
      <div className="min-h-[80vh] flex items-center justify-center py-16 px-4 bg-[#f8f9fb]">
        <div className="w-full max-w-[400px]">
          <div className="bg-white rounded-3xl border border-[#E5E7EB] shadow-[0_8px_32px_rgba(0,0,0,0.06)] px-8 py-10">
            <div className="mb-8">
              <h1 className="text-[22px] font-extrabold text-[#191c1e] tracking-tight">Set new password</h1>
              <p className="mt-1.5 text-[13px] text-[#444748]">
                Enter and confirm your new password.
              </p>
            </div>
            <Suspense>
              <ResetPasswordForm />
            </Suspense>
          </div>
        </div>
      </div>
    </StorefrontLayout>
  );
}
