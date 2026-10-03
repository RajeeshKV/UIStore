import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminLoginForm } from "@/features/admin/AdminLoginForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Sign In | Shopey",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fb] px-4 py-16">
      <div className="w-full max-w-[400px]">
        {/* Brand */}
        <div className="mb-8 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Shopey" className="h-16 w-16 mx-auto mb-4 object-contain" />
          <h1 className="text-[22px] font-extrabold text-[#191c1e] tracking-tight">Admin Portal</h1>
          <p className="mt-1.5 text-[13px] text-[#444748]">Sign in to manage your store</p>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-3xl border border-[#E5E7EB] shadow-[0_8px_32px_rgba(0,0,0,0.06)] p-7">
          <Suspense>
            <AdminLoginForm />
          </Suspense>
        </div>

        <p className="mt-6 text-center text-[11px] text-[#5A6578]">Shopey Administration</p>
      </div>
    </div>
  );
}
