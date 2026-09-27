"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { authApi } from "@/services/api/auth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  if (!token) {
    return (
      <div className="text-center py-8">
        <p className="text-body-sm text-danger mb-4">Invalid or missing reset token.</p>
        <Link href="/auth/forgot-password" className="text-body-sm text-foreground-muted hover:text-foreground transition-colors">
          Request a new link
        </Link>
      </div>
    );
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!password) e.password = "Password is required.";
    else if (password.length < 8) e.password = "Password must be at least 8 characters.";
    if (password !== confirm) e.confirm = "Passwords do not match.";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setApiError("");
    setLoading(true);
    const result = await authApi.resetPassword(token, password);
    setLoading(false);
    if (result.ok) {
      router.push("/auth/login?reset=1");
    } else {
      const msg = "error" in result && "message" in result.error ? result.error.message : "Could not reset password. The link may have expired.";
      setApiError(msg);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {apiError && (
        <p role="alert" className="text-body-sm text-danger bg-danger/5 border border-danger/20 rounded-md px-4 py-3">
          {apiError}
        </p>
      )}

      <Input
        label="New Password"
        type={showPw ? "text" : "password"}
        required
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
        hint="At least 8 characters"
        iconRight={
          <button type="button" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? "Hide password" : "Show password"} className="text-foreground-muted hover:text-foreground transition-colors">
            {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        }
      />

      <Input
        label="Confirm Password"
        type={showPw ? "text" : "password"}
        required
        autoComplete="new-password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        error={errors.confirm}
      />

      <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
        Set New Password
      </Button>
    </form>
  );
}
