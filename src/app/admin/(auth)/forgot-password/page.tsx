"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { authApi } from "@/services/api/auth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

export default function AdminForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) { setError("Email is required."); return; }
    setError("");
    setLoading(true);
    // Always show the same success message regardless of outcome (enumeration safety)
    await authApi.requestPasswordReset(email.trim());
    setLoading(false);
    setSubmitted(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4 py-16">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="mb-8 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Shopey" className="h-20 w-20 mx-auto mb-4 object-contain" />
          <h1 className="text-h3 font-bold text-foreground">Reset Password</h1>
          <p className="mt-1.5 text-body-sm text-foreground-muted">
            Enter your admin email address.
          </p>
        </div>

        <div className="bg-background rounded-xl border border-border p-6 shadow-sm">
          {submitted ? (
            <div className="flex flex-col gap-4 text-center">
              <div className="flex justify-center">
                <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                  <svg className="size-6 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <p className="text-body-sm text-foreground">
                If an account exists for that email, a password reset link has been sent.
              </p>
              <p className="text-caption text-foreground-muted">
                Check your inbox and follow the instructions in the email.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
              {error && (
                <p role="alert" className="text-body-sm text-danger bg-danger/5 border border-danger/20 rounded-md px-4 py-3">
                  {error}
                </p>
              )}
              <Input
                label="Email address"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
              />
              <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
                Send Reset Link
              </Button>
            </form>
          )}
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/admin/login"
            className="inline-flex items-center gap-1.5 text-body-sm text-foreground-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
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
