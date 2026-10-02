"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "./AuthContext";
import { useStore } from "@/features/store/StoreContext";
import { cn } from "@/lib/utils";

// ── Google SVG icon ───────────────────────────────────────────────────────────

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin size-5 text-foreground-muted" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            use_fedcm_for_prompt?: boolean;
          }) => void;
          prompt: (callback?: (n: {
            isNotDisplayed: () => boolean;
            isSkippedMoment: () => boolean;
            getDismissedReason: () => string;
          }) => void) => void;
          cancel: () => void;
          renderButton: (
            parent: HTMLElement,
            options: Record<string, unknown>,
            clickHandler?: () => void
          ) => void;
        };
      };
    };
  }
}

interface GoogleLoginButtonProps {
  className?: string;
}

export function GoogleLoginButton({ className }: GoogleLoginButtonProps) {
  const { signInWithGoogle } = useAuth();
  const { settings } = useStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const googleEnabled = settings?.auth?.googleOAuthEnabled !== false;
  const googleClientId: string =
    settings?.auth?.googleClientId ||
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    "";

  const handleGoogleLogin = useCallback(async () => {
    if (loading) return;
    if (!googleClientId) {
      setError("Google sign-in is not configured. Please contact support.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await loadGoogleScript();

      const idToken = await getGoogleIdTokenViaPopup(googleClientId);

      const result = await signInWithGoogle(idToken);
      if (result.ok) {
        router.push(redirectTo);
      } else {
        setError(result.error ?? "Sign-in failed. Please try again.");
        setLoading(false);
      }
    } catch (err: unknown) {
      setLoading(false);
      if (err instanceof Error) {
        const msg = err.message ?? "";
        if (msg === "cancelled") {
          setError("Sign-in was cancelled. Please try again.");
        } else if (msg === "popup_blocked") {
          setError("Popup was blocked. Please allow popups for this site and try again.");
        } else {
          setError("Google sign-in failed. Please try again.");
        }
      } else {
        setError("Google sign-in failed. Please check your connection and try again.");
      }
    }
  }, [loading, googleClientId, signInWithGoogle, router, redirectTo]);

  if (!googleEnabled) return null;

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <p role="alert" className="text-[13px] text-danger bg-danger/5 border border-danger/20 rounded-xl px-4 py-3 text-center">
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
          "relative flex h-12 w-full items-center justify-center gap-3 rounded-xl",
          "border border-[#E5E7EB] bg-white",
          "text-[14px] font-semibold text-[#191c1e]",
          "transition-all duration-150",
          "hover:bg-[#f3f4f6] hover:border-[#c4c7c7] hover:shadow-sm",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D0D0D]",
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

// ── Helpers ───────────────────────────────────────────────────────────────────

function loadGoogleScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts) { resolve(); return; }
    const existing = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("script_load_failed")));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("script_load_failed"));
    document.head.appendChild(script);
  });
}

/**
 * Gets a Google ID token by rendering a hidden button and clicking it.
 *
 * Why this approach instead of prompt():
 * - prompt() uses One Tap overlay which is blocked by browsers in many contexts
 *   (cross-origin iframes, domains not in authorized origins, previous dismissals)
 * - renderButton() with a click handler opens a proper browser popup window
 *   that ALWAYS works as long as the domain is in authorized JavaScript origins
 *   in Google Cloud Console
 *
 * The flow:
 * 1. Create a hidden div, render the Google button into it
 * 2. google.accounts.id.initialize() sets up the callback
 * 3. Programmatically click the rendered button — opens Google account picker popup
 * 4. User selects account → callback fires with credential (ID token)
 * 5. Resolve with the ID token
 */
function getGoogleIdTokenViaPopup(clientId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const gid = window.google?.accounts?.id;
    if (!gid) {
      reject(new Error("Google library not loaded"));
      return;
    }

    let resolved = false;

    gid.initialize({
      client_id: clientId,
      callback: (response) => {
        if (resolved) return;
        resolved = true;
        if (response.credential) {
          resolve(response.credential);
        } else {
          reject(new Error("cancelled"));
        }
      },
      auto_select: false,
      use_fedcm_for_prompt: false,
    });

    // Create a hidden container for the Google button
    const container = document.createElement("div");
    container.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;overflow:hidden;";
    document.body.appendChild(container);

    // Render Google's button — this triggers the real popup flow (not One Tap)
    gid.renderButton(container, {
      type: "standard",
      size: "large",
      text: "continue_with",
    });

    // Click the rendered button to open the Google account picker
    setTimeout(() => {
      const btn = container.querySelector("div[role='button'], button") as HTMLElement | null;
      if (btn) {
        btn.click();
      } else {
        // renderButton may not have rendered yet — try the iframe button
        const iframe = container.querySelector("iframe");
        if (iframe) {
          // Can't click inside cross-origin iframe — fall back to prompt
          gid.prompt((notification) => {
            if (!resolved && (notification.isNotDisplayed() || notification.isSkippedMoment())) {
              if (!resolved) {
                resolved = true;
                reject(new Error("cancelled"));
              }
            }
          });
        } else {
          reject(new Error("cancelled"));
        }
      }

      // Cleanup container after a delay
      setTimeout(() => {
        try { document.body.removeChild(container); } catch { /* already removed */ }
      }, 30000);
    }, 100);
  });
}
