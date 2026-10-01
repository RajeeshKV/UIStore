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
      // Outer wrapper provides the horizontal padding; arrows sit in this gutter
      className="relative w-full px-8 md:px-10 pt-3 md:pt-4"
    >
      {/* ── Left arrow ────────────────────────────────────────── */}
      {sorted.length > 1 && (
        <button
          onClick={() => { prev(); resetTimer(); }}
          aria-label="Previous slide"
          className={cn(
            "absolute left-1 top-1/2 -translate-y-1/2 z-20",
            "flex h-8 w-8 items-center justify-center rounded-full",
            "bg-background border border-border shadow-sm",
            "hover:bg-muted transition-colors duration-150",
            "focus-visible:outline-2 focus-visible:outline-focus",
          )}
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>
      )}

      {/* ── Slide card — image fills the entire card ──────────── */}
      {/*
        No fixed aspect ratio — let the image's natural proportions drive height.
        The card is a positioned container; the image is absolute-fill behind
        a left-side gradient overlay that keeps text legible.
        Use min-h to guarantee a reasonable height on all screen sizes.
      */}
      <div className="relative w-full overflow-hidden rounded-2xl border border-border min-h-[160px] sm:min-h-[220px] md:min-h-[280px] lg:min-h-[320px]">
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

            {/* Gradient overlay — fades from left so text is readable */}
            <div
              className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/20 to-transparent"
              aria-hidden="true"
            />

            {/* Text content — left side, vertically centred */}
            <div className="relative z-10 h-full flex items-center">
              <div className="px-6 md:px-10 py-8 md:py-12 max-w-[52%]">
                <p className="text-[9px] md:text-[10px] font-semibold tracking-[0.18em] uppercase text-white/70 mb-1.5">
                  NEW ARRIVALS
                </p>
                <h1 className="text-[1.25rem] sm:text-[1.6rem] md:text-[2rem] lg:text-[2.4rem] font-bold text-white leading-[1.1] tracking-tight">
                  {slide.title}
                </h1>
                {slide.subtitle && (
                  <p className="mt-2 text-[11px] md:text-[13px] text-white/75 leading-relaxed max-w-[240px]">
                    {slide.subtitle}
                  </p>
                )}
                <Link
                  href="/shop"
                  className={cn(
                    "mt-4 self-start inline-flex items-center gap-1.5",
                    "h-8 md:h-10 px-4 md:px-6 rounded-md",
                    "bg-white text-foreground text-[11px] md:text-[13px] font-semibold",
                    "hover:bg-white/90 transition-colors duration-150",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
                  )}
                >
                  {ctaLabel}
                  <ArrowRight className="size-3" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* ── Dot indicators ──────────────────────────────────── */}
        {sorted.length > 1 && (
          <div
            role="tablist"
            aria-label="Carousel slides"
            className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5"
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
            "absolute right-1 top-1/2 -translate-y-1/2 z-20",
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
    <div className="w-full px-8 md:px-10 pt-3 md:pt-4">
      <Skeleton className="w-full rounded-2xl min-h-[220px] md:min-h-[280px] lg:min-h-[320px]" />
    </div>
  );
}

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? "3%" : "-3%", opacity: 0 }),
  center: { x: "0%", opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? "-3%" : "3%", opacity: 0 }),
};
