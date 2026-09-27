"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Scrolls the window back to the top on every client-side navigation.
 * Respects prefers-reduced-motion — uses "auto" instead of "smooth" when
 * the user has requested reduced motion.
 *
 * Must be wrapped in <Suspense> because useSearchParams() requires it.
 */
function ScrollResetter() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const previousPath = useRef<string | null>(null);

  useEffect(() => {
    const current = pathname + searchParams.toString();
    if (previousPath.current === current) return;
    previousPath.current = current;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    window.scrollTo({ top: 0, behavior: prefersReduced ? "auto" : "smooth" });
  }, [pathname, searchParams]);

  return null;
}

export { ScrollResetter };
