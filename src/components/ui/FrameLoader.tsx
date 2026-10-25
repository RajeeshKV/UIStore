"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { getLoaderAnimation } from "@/config/loaderAnimations";

const preloadedAnimationPaths = new Set<string>();

interface FrameLoaderProps {
  brand?: string;
  size?: number | string;
  className?: string;
  label?: string;
}

/** Animated, accessible loader backed by an interchangeable ordered frame set. */
export function FrameLoader({ brand, size = 64, className, label }: FrameLoaderProps) {
  const animation = getLoaderAnimation(brand);
  const [frameIndex, setFrameIndex] = useState(0);
  const accessibleLabel = label ?? animation.label;

  useEffect(() => {
    if (animation.frames.length < 2) return;

    if (!preloadedAnimationPaths.has(animation.basePath)) {
      animation.frames.forEach((frame) => {
        const image = new window.Image();
        image.src = `${animation.basePath}/${frame}`;
      });
      preloadedAnimationPaths.add(animation.basePath);
    }
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const interval = prefersReducedMotion
      ? undefined
      : window.setInterval(
          () => setFrameIndex((current) => (current + 1) % animation.frames.length),
          animation.frameDuration ?? 90,
        );

    return () => {
      if (interval !== undefined) window.clearInterval(interval);
    };
  }, [animation]);

  const frame = animation.frames[frameIndex] ?? animation.frames[0];
  if (!frame) return null;

  return (
    <span
      role="status"
      aria-label={accessibleLabel}
      className={cn("inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <span className="sr-only">{accessibleLabel}</span>
      <Image
        src={`${animation.basePath}/${frame}`}
        width={290}
        height={290}
        unoptimized
        alt=""
        aria-hidden="true"
        className="theme-frame-loader h-full w-full object-contain"
      />
    </span>
  );
}

/** Centered route fallback, used by Next.js loading boundaries. */
export function RouteLoader() {
  const animation = getLoaderAnimation();

  return (
    <div className="fixed inset-0 z-[10000] grid place-items-center bg-background px-6" role="presentation">
      <FrameLoader size="clamp(5rem, 18vw, 9rem)" label={animation.label} />
    </div>
  );
}
