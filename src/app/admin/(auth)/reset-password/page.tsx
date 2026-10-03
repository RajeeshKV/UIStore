"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { authApi } from "@/services/api/auth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

function AdminResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <p className="text-body-sm text-danger">
          Invalid or missing reset token. Please request a new password reset.
        </p>
        <Link href="/admin/forgot-password" className="text-body-sm text-foreground-muted hover:text-foreground underline">
          Request reset
        </Link>
      </div>
    );
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!password) e.password = "Password is required.";
    else if (password.length < 8) e.password = "Password must be at least 8 characters.";
    if (!confirmPassword) e.confirmPassword = "Please confirm your password.";
    else if (password !== confirmPassword) e.confirmPassword = "Passwords do not match.";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setApiError("");
    setLoading(true);
    const res = await authApi.resetPassword(token, password);
    setLoading(false);
    if (res.ok) {
      setSuccess(true);
      setTimeout(() => router.push("/admin/login"), 2500);
    } else {
      setApiError(
        res.error && "message" in res.error
          ? res.error.message
          : "Password reset failed. The link may have expired.",
      );
    }
  }

  if (success) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <div className="flex justify-center">
          <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
            <svg className="size-6 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        <p className="text-body-sm text-foreground font-medium">Password reset successfully.</p>
        <p className="text-caption text-foreground-muted">Redirecting you to sign in…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {apiError && (
        <p role="alert" className="text-body-sm text-danger bg-danger/5 border border-danger/20 rounded-md px-4 py-3">
          {apiError}
        </p>
      )}
      <Input
        label="New password"
        type={showPassword ? "text" : "password"}
        autoComplete="new-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
        hint="At least 8 characters."
        iconRight={
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="text-foreground-muted hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        }
      />
      <Input
        label="Confirm new password"
        type={showPassword ? "text" : "password"}
        autoComplete="new-password"
        required
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        error={errors.confirmPassword}
      />
      <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
        Reset Password
      </Button>
    </form>
  );
}

export default function AdminResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Shopey" className="h-20 w-20 mx-auto mb-4 object-contain" />
          <h1 className="text-h3 font-bold text-foreground">Set New Password</h1>
          <p className="mt-1.5 text-body-sm text-foreground-muted">
            Enter and confirm your new admin password.
          </p>
        </div>

        <div className="bg-background rounded-xl border border-border p-6 shadow-sm">
          <Suspense fallback={<div className="h-32 animate-skeleton rounded-md bg-muted" />}>
            <AdminResetPasswordForm />
          </Suspense>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/admin/login"
            className="text-body-sm text-foreground-muted hover:text-foreground transition-colors"
          >
            Back to sign in
          </Link>
        </div>
        <p className="mt-4 text-center text-caption text-foreground-muted">
          Shopey Administration
        </p>
      </div>
    </div>
  );
}
