"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "./AuthContext";
import { cn } from "@/lib/utils";

// ── Google SVG icon ───────────────────────────────────────────────────────────

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg
      className="animate-spin size-5 text-foreground-muted"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

// ── Error messages ────────────────────────────────────────────────────────────

function friendlyGoogleError(code: string): string {
  switch (code) {
    case "popup_closed_by_user":
    case "popup_blocked_by_browser":
      return "Sign-in was cancelled. Please try again.";
    case "access_denied":
      return "Access was denied. Please allow the permissions to continue.";
    case "immediate_failed":
      return "Automatic sign-in failed. Please click the button to sign in.";
    default:
      return "Google sign-in failed. Please try again.";
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

interface GoogleLoginButtonProps {
  className?: string;
}

export function GoogleLoginButton({ className }: GoogleLoginButtonProps) {
  const { signInWithGoogle } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = useCallback(async () => {
    if (loading) return;
    setError(null);
    setLoading(true);

    try {
      // Load the Google Identity Services library if not already loaded
      await loadGoogleScript();

      const idToken = await getGoogleIdToken();
      if (!idToken) {
        setError("Sign-in was cancelled. Please try again.");
        setLoading(false);
        return;
      }

      const result = await signInWithGoogle(idToken);
      if (result.ok) {
        router.push(redirectTo);
      } else {
        setError(result.error ?? "Sign-in failed. Please try again.");
        setLoading(false);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        const code = (err as Error & { code?: string }).code ?? "";
        setError(friendlyGoogleError(code));
      } else {
        setError("Sign-in failed. Please check your connection and try again.");
      }
      setLoading(false);
    }
  }, [loading, signInWithGoogle, router, redirectTo]);

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <p
          role="alert"
          className="text-body-sm text-danger bg-danger/5 border border-danger/20 rounded-md px-4 py-3 text-center"
        >
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={loading}
        aria-busy={loading}
        aria-label="Continue with Google"
        className={cn(
          "relative flex h-12 w-full items-center justify-center gap-3 rounded-md",
          "border border-border bg-surface-elevated",
          "text-body font-medium text-foreground",
          "transition-all duration-150",
          "hover:bg-muted hover:border-border-strong",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
          "disabled:cursor-not-allowed disabled:opacity-60",
          className,
        )}
      >
        {loading ? (
          <>
            <Spinner />
            <span>Signing in…</span>
          </>
        ) : (
          <>
            <GoogleIcon className="size-5 shrink-0" />
            <span>Continue with Google</span>
          </>
        )}
      </button>
    </div>
  );
}

// ── Google Identity Services helpers ─────────────────────────────────────────

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
          }) => void;
          prompt: (callback?: (notification: {
            isNotDisplayed: () => boolean;
            isSkippedMoment: () => boolean;
            getDismissedReason: () => string;
          }) => void) => void;
          cancel: () => void;
          renderButton: (element: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

function loadGoogleScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts) {
      resolve();
      return;
    }
    const existing = document.querySelector('script[src*="accounts.google.com"]');
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load Google script")));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google sign-in. Check your connection."));
    document.head.appendChild(script);
  });
}

/**
 * Uses Google Identity Services One Tap / popup to get an ID token.
 * Returns the credential string or null if cancelled/failed.
 */
function getGoogleIdToken(): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const clientId = getGoogleClientId();
    if (!clientId) {
      reject(new Error("Google sign-in is not configured. Please contact support."));
      return;
    }

    if (!window.google?.accounts?.id) {
      reject(new Error("Google sign-in library failed to load. Please refresh and try again."));
      return;
    }

    // Use One Tap which works both as a popup and silently
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => {
        if (response.credential) {
          resolve(response.credential);
        } else {
          resolve(null);
        }
      },
      auto_select: false,
    });

    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        const reason = notification.getDismissedReason?.() ?? "unknown";
        const err = new Error(reason) as Error & { code: string };
        err.code = reason === "credential_returned" ? "credential_returned" : "popup_closed_by_user";
        // Only reject if no credential was returned
        // The callback above handles the success case
        if (reason !== "credential_returned") {
          reject(err);
        }
      }
    });
  });
}

/**
 * Google client_id must be configured in the admin integrations settings.
 * The backend exposes it through the integration status public fields.
 * For the initial render we can read it from a data attribute injected by the server.
 *
 * Fallback: reads NEXT_PUBLIC_GOOGLE_CLIENT_ID (optional build-time var).
 * This is the OAuth client_id — it is public and safe to expose.
 */
function getGoogleClientId(): string {
  // Check meta tag injected by the Google integration (preferred: runtime)
  const meta = document.querySelector<HTMLMetaElement>('meta[name="google-signin-client_id"]');
  if (meta?.content) return meta.content;

  // Fallback to build-time env var (only the public client_id, never the secret)
  return process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
}
