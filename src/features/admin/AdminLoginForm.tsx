"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useAdminAuth } from "./AdminAuthContext";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function AdminLoginForm() {
  const { login } = useAdminAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ identifier?: string; password?: string }>({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  function validate() {
    const e: typeof errors = {};
    if (!identifier.trim()) e.identifier = "Username or email is required.";
    if (!password) e.password = "Password is required.";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setApiError("");
    setLoading(true);
    // Do NOT trim password — intentional per spec
    const result = await login(identifier, password);
    setLoading(false);
    if (!result.ok) {
      setApiError(result.error ?? "Sign in failed. Please try again.");
    }
    // On success: AdminGuard detects isAuthenticated=true and redirects automatically
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {apiError && (
        <p
          role="alert"
          className="text-body-sm text-danger bg-danger/5 border border-danger/20 rounded-md px-4 py-3"
        >
          {apiError}
        </p>
      )}

      <Input
        label="Username or Email"
        type="text"
        autoComplete="username"
        required
        value={identifier}
        onChange={(e) => setIdentifier(e.target.value)}
        error={errors.identifier}
        placeholder="admin or admin@example.com"
      />

      <Input
        label="Password"
        type={showPassword ? "text" : "password"}
        autoComplete="current-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
        iconRight={
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="text-foreground-muted hover:text-foreground transition-colors"
          >
            {showPassword ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        }
      />

      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        loading={loading}
      >
        Sign In
      </Button>

      <div className="text-center">
        <Link
          href="/admin/forgot-password"
          className="text-body-sm text-foreground-muted hover:text-foreground transition-colors"
        >
          Forgot password?
        </Link>
      </div>
    </form>
  );
}
