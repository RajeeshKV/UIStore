"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/Skeleton";
import type { StorefrontCarouselSlideResponse } from "@/types/api";

interface HeroCarouselProps {
  slides: StorefrontCarouselSlideResponse[] | null;
}

export function HeroCarousel({ slides }: HeroCarouselProps) {
  const shouldReduce = useReducedMotion();
  if (slides === null) return <HeroCarouselSkeleton />;
  if (slides.length === 0) return null;
  return <HeroCarouselInner slides={slides} shouldReduce={!!shouldReduce} />;
}

function HeroCarouselInner({
  slides,
  shouldReduce,
}: {
  slides: StorefrontCarouselSlideResponse[];
  shouldReduce: boolean;
}) {
  const sorted = [...slides].sort((a, b) => a.sortOrder - b.sortOrder);

  const [current, setCurrent] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = useCallback((idx: number, direction: 1 | -1 = 1) => {
    setDir(direction);
    setCurrent(idx);
  }, []);

  const prev = useCallback(
    () => goTo((current - 1 + sorted.length) % sorted.length, -1),
    [current, sorted.length, goTo],
  );

  const next = useCallback(
    () => goTo((current + 1) % sorted.length, 1),
    [current, sorted.length, goTo],
  );

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(next, 5000);
  }, [next]);

  useEffect(() => {
    if (shouldReduce || sorted.length <= 1) return;
    timerRef.current = setInterval(next, 5000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [next, shouldReduce, sorted.length]);

  const slide = sorted[current];
  const ctaLabel = slide.ctaText ?? "Shop Now";

  return (
    <section
      aria-label="Hero carousel"
      aria-roledescription="carousel"
      // No horizontal inset — card goes full container width.
      // Arrows sit partially over the card edges.
      className="relative w-full pt-3 md:pt-4 container-x mx-auto"
    >
      {/* ── Left arrow ────────────────────────────────────────── */}
      {sorted.length > 1 && (
        <button
          onClick={() => { prev(); resetTimer(); }}
          aria-label="Previous slide"
          className={cn(
            "absolute -left-1 md:left-0 top-1/2 -translate-y-1/2 z-20",
            "flex h-8 w-8 items-center justify-center rounded-full",
            "bg-background border border-border shadow-sm",
            "hover:bg-muted transition-colors duration-150",
            "focus-visible:outline-2 focus-visible:outline-focus",
          )}
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>
      )}

      {/* ── Slide card ─────────────────────────────────────────── */}
      {/*
        aspect-ratio 16/5 matches the wide-and-short banner format the user
        uploaded (roughly 1400×438). Adjust the denominator if your image is
        taller or shorter. The image always fills the full card.
      */}
      <div
        className="relative w-full overflow-hidden rounded-2xl border border-border"
        style={{ aspectRatio: "16 / 5" }}
      >
        <AnimatePresence mode="wait" initial={false} custom={dir}>
          <motion.div
            key={slide.id}
            custom={dir}
            variants={shouldReduce ? {} : slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0"
            aria-roledescription="slide"
            aria-label={`Slide ${current + 1} of ${sorted.length}: ${slide.title}`}
          >
            {/* Full-bleed image */}
            {slide.imageUrl ? (
              <Image
                src={slide.imageUrl}
                alt={slide.title ?? ""}
                fill
                priority={current === 0}
                sizes="100vw"
                className="object-cover object-center"
              />
            ) : (
              <div className="absolute inset-0 bg-[#f5f0ea]" />
            )}

            {/* Gradient — left side only, keeps text readable */}
            <div
              className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/15 to-transparent"
              aria-hidden="true"
            />

            {/* Text content */}
            <div className="relative z-10 h-full flex items-center px-8 md:px-12">
              <div className="max-w-[45%]">
                <p className="text-[9px] md:text-[10px] font-semibold tracking-[0.18em] uppercase text-white/70 mb-1.5">
                  NEW ARRIVALS
                </p>
                <h1 className="text-[1.1rem] sm:text-[1.5rem] md:text-[1.9rem] font-bold text-white leading-[1.1] tracking-tight">
                  {slide.title}
                </h1>
                {slide.subtitle && (
                  <p className="mt-1.5 text-[10px] md:text-[12px] text-white/75 leading-relaxed">
                    {slide.subtitle}
                  </p>
                )}
                <Link
                  href="/shop"
                  className={cn(
                    "mt-3 md:mt-4 self-start inline-flex items-center gap-1.5",
                    "h-8 md:h-9 px-4 md:px-5 rounded-md",
                    "bg-foreground text-background text-[11px] md:text-[12px] font-semibold",
                    "hover:bg-foreground/85 transition-colors duration-150",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground",
                  )}
                >
                  {ctaLabel}
                  <ArrowRight className="size-3" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Dot indicators */}
        {sorted.length > 1 && (
          <div
            role="tablist"
            aria-label="Carousel slides"
            className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5"
          >
            {sorted.map((s, i) => (
              <button
                key={s.id}
                role="tab"
                aria-selected={i === current}
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => { goTo(i, i > current ? 1 : -1); resetTimer(); }}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i === current
                    ? "w-5 bg-white"
                    : "w-1.5 bg-white/40 hover:bg-white/70",
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Right arrow ───────────────────────────────────────── */}
      {sorted.length > 1 && (
        <button
          onClick={() => { next(); resetTimer(); }}
          aria-label="Next slide"
          className={cn(
            "absolute -right-1 md:right-0 top-1/2 -translate-y-1/2 z-20",
            "flex h-8 w-8 items-center justify-center rounded-full",
            "bg-background border border-border shadow-sm",
            "hover:bg-muted transition-colors duration-150",
            "focus-visible:outline-2 focus-visible:outline-focus",
          )}
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
      )}
    </section>
  );
}

export function HeroCarouselSkeleton() {
  return (
    <div className="w-full pt-3 md:pt-4 container-x mx-auto">
      <Skeleton className="w-full rounded-2xl" style={{ aspectRatio: "16 / 5" }} />
    </div>
  );
}

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? "3%" : "-3%", opacity: 0 }),
  center: { x: "0%", opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? "-3%" : "3%", opacity: 0 }),
};
