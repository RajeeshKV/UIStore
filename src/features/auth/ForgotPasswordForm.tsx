"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { authApi } from "@/services/api/auth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setEmailError("Enter a valid email address.");
      return;
    }
    setEmailError("");
    setLoading(true);
    // Always show success — enumeration-safe: don't reveal if email exists
    await authApi.requestPasswordReset(email.trim());
    setLoading(false);
    setSent(true);
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-4 text-center py-8">
        <div className="rounded-2xl bg-success/10 border border-success/20 p-5">
          <CheckCircle className="size-8 text-success" aria-hidden="true" />
        </div>
        <div>
          <p className="text-[15px] font-bold text-foreground">Check your email</p>
          <p className="mt-2 text-[13px] text-foreground-muted max-w-sm leading-relaxed">
            If an account exists for <strong>{email}</strong>, we&apos;ve sent password reset instructions.
          </p>
        </div>
        <Link href="/auth/login" className="text-[13px] text-foreground-muted hover:text-foreground transition-colors">
          Back to Sign In
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <Input
        label="Email address"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={emailError}
      />
      <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
        Send Reset Link
      </Button>
      <Link href="/auth/login" className="text-[13px] text-center text-foreground-muted hover:text-foreground transition-colors">
        Back to Sign In
      </Link>
    </form>
  );
}
