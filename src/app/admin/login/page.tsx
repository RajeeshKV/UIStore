import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminAuthProvider } from "@/features/admin/AdminAuthContext";
import { AdminLoginForm } from "@/features/admin/AdminLoginForm";

export const metadata: Metadata = {
  title: "Admin Sign In | Kromic Store",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <AdminAuthProvider>
      <div className="min-h-screen flex items-center justify-center bg-surface px-4 py-16">
        <div className="w-full max-w-sm">
          {/* Brand */}
          <div className="mb-8 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Kromic Store"
              className="h-20 w-20 mx-auto mb-4 object-contain"
            />
            <h1 className="text-h3 font-bold text-foreground">Admin Portal</h1>
            <p className="mt-1.5 text-body-sm text-foreground-muted">
              Sign in to manage your store
            </p>
          </div>

          {/* Form */}
          <div className="bg-background rounded-xl border border-border p-6 shadow-sm">
            <Suspense>
              <AdminLoginForm />
            </Suspense>
          </div>

          <p className="mt-6 text-center text-caption text-foreground-muted">
            Kromic Store — Administration
          </p>
        </div>
      </div>
    </AdminAuthProvider>
  );
}
