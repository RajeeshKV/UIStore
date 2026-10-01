"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/Skeleton";
import type { StorefrontCarouselSlideResponse } from "@/types/api";

// ── Component ────────────────────────────────────────────────────────────────

interface HeroCarouselProps {
  /**
   * Slides fetched from GET /api/v1/store/carousel.
   * null  = still loading (show skeleton)
   * []    = no slides configured (hide carousel entirely)
   * [...] = render the carousel
   */
  slides: StorefrontCarouselSlideResponse[] | null;
}

export function HeroCarousel({ slides }: HeroCarouselProps) {
  const shouldReduce = useReducedMotion();

  // Loading state
  if (slides === null) return <HeroCarouselSkeleton />;

  // No slides configured — render nothing
  if (slides.length === 0) return null;

  return <HeroCarouselInner slides={slides} shouldReduce={!!shouldReduce} />;
}

// Inner component — only mounts when we have real slides
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
  // CTA destination is always /shop — server enforces this constant
  const ctaLabel = slide.ctaText ?? "Shop Now";

  return (
    <section
      aria-label="Hero carousel"
      aria-roledescription="carousel"
      className="relative w-full px-3 md:px-6 lg:px-8 pt-3 md:pt-4"
    >
      {/* Left arrow — sits outside the rounded card */}
      {sorted.length > 1 && (
        <button
          onClick={() => { prev(); resetTimer(); }}
          aria-label="Previous slide"
          className={cn(
            "absolute left-0 md:left-1 top-1/2 -translate-y-1/2 z-20",
            "flex h-8 w-8 items-center justify-center rounded-full",
            "bg-background border border-border shadow-sm",
            "hover:bg-muted transition-colors duration-150",
            "focus-visible:outline-2 focus-visible:outline-focus",
          )}
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>
      )}

      {/* Slide card */}
      <div
        className="relative w-full overflow-hidden rounded-2xl border border-border bg-[#f5f0ea]"
        style={{ aspectRatio: "16 / 4.2" }}
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
            className="absolute inset-0 flex"
            aria-roledescription="slide"
            aria-label={`Slide ${current + 1} of ${sorted.length}: ${slide.title}`}
          >
            {/* Left: text content ~42% width */}
            <div className="relative z-10 flex items-center w-[42%] shrink-0 pl-6 md:pl-10 pr-4">
              <div className="flex flex-col gap-1.5 md:gap-2">
                <p className="text-[9px] md:text-[10px] font-semibold tracking-[0.18em] uppercase text-foreground-muted">
                  NEW ARRIVALS
                </p>
                <h1 className="text-[1.1rem] sm:text-[1.35rem] md:text-[1.7rem] lg:text-[2rem] font-bold text-foreground leading-[1.1] tracking-tight">
                  {slide.title}
                </h1>
                {slide.subtitle && (
                  <p className="text-[10px] md:text-[12px] text-foreground-muted leading-snug max-w-[180px] md:max-w-[220px]">
                    {slide.subtitle}
                  </p>
                )}
                <Link
                  href="/shop"
                  className={cn(
                    "mt-1 self-start inline-flex items-center gap-1.5",
                    "h-7 md:h-9 px-3 md:px-5 rounded-md",
                    "bg-foreground text-background text-[10px] md:text-[12px] font-semibold",
                    "hover:bg-foreground/85 transition-colors duration-150",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground",
                  )}
                >
                  {ctaLabel}
                  <ArrowRight className="size-3" aria-hidden="true" />
                </Link>
              </div>
            </div>

            {/* Right: image fills remaining 58% */}
            <div className="relative flex-1 overflow-hidden">
              {slide.imageUrl && (
                <Image
                  src={slide.imageUrl}
                  alt={slide.title ?? ""}
                  fill
                  priority={current === 0}
                  sizes="(max-width: 768px) 58vw, 58vw"
                  className="object-cover object-center"
                />
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Dot indicators */}
        {sorted.length > 1 && (
          <div
            role="tablist"
            aria-label="Carousel slides"
            className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5"
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
                    ? "w-5 bg-foreground"
                    : "w-1.5 bg-foreground/30 hover:bg-foreground/60",
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* Right arrow — sits outside the rounded card */}
      {sorted.length > 1 && (
        <button
          onClick={() => { next(); resetTimer(); }}
          aria-label="Next slide"
          className={cn(
            "absolute right-0 md:right-1 top-1/2 -translate-y-1/2 z-20",
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

// ── Skeleton ─────────────────────────────────────────────────────────────────

export function HeroCarouselSkeleton() {
  return (
    <div className="w-full px-3 md:px-6 lg:px-8 pt-3 md:pt-4">
      <Skeleton className="w-full rounded-2xl" style={{ aspectRatio: "16 / 4.2" }} />
    </div>
  );
}

// ── Slide transition variants ─────────────────────────────────────────────────

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? "3%" : "-3%", opacity: 0 }),
  center: { x: "0%", opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? "-3%" : "3%", opacity: 0 }),
};
