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
  const [dir, setDir]         = useState<1 | -1>(1);
  const timerRef              = useRef<ReturnType<typeof setInterval> | null>(null);

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
      className="relative w-full px-5 md:px-8 lg:px-10 pt-4 md:pt-5"
    >
      {/* ── Prev arrow ─────────────────────────────────────────────────────── */}
      {sorted.length > 1 && (
        <button
          onClick={() => { prev(); resetTimer(); }}
          aria-label="Previous slide"
          className={cn(
            "absolute left-4 md:left-5 top-1/2 -translate-y-1/2 z-20",
            "flex h-11 w-11 items-center justify-center rounded-full",
            "bg-white/80 backdrop-blur-md border border-white/80 text-[#191c1e]",
            "shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:bg-white hover:scale-105 active:scale-95",
            "transition-all duration-150",
          )}
        >
          <ChevronLeft className="size-5" aria-hidden="true" />
        </button>
      )}

      {/* ── Slide card ─────────────────────────────────────────────────────── */}
      {/* Design reference: rounded-3xl, ~440-490px tall desktop, full-bleed within padding */}
      <div
        className="relative w-full overflow-hidden rounded-3xl shadow-[0_12px_36px_rgba(0,0,0,0.06)] bg-[#edeef0]"
        style={{ height: "clamp(220px, 34vw, 490px)" }}
      >
        <AnimatePresence mode="wait" initial={false} custom={dir}>
          <motion.div
            key={slide.id}
            custom={dir}
            variants={shouldReduce ? {} : slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0"
            aria-roledescription="slide"
            aria-label={`Slide ${current + 1} of ${sorted.length}: ${slide.title}`}
          >
            {/* Full-bleed background image */}
            {slide.imageUrl ? (
              <Image
                src={slide.imageUrl}
                alt={slide.title ?? ""}
                fill
                priority={current === 0}
                sizes="(max-width: 1440px) 100vw"
                className="object-cover object-center scale-[1.01]"
              />
            ) : (
              <div className="absolute inset-0 bg-[#f5f0ea]" />
            )}

            {/* Gradient — left side only, text readable */}
            <div
              className="absolute inset-0 bg-gradient-to-r from-[#f8f9fb]/95 via-[#f8f9fb]/70 md:via-[#f8f9fb]/40 to-transparent"
              aria-hidden="true"
            />

            {/* Text content */}
            <div className="relative z-10 h-full flex items-center pl-8 sm:pl-14 lg:pl-16">
              <div className="max-w-[45%]">
                {/* NEW ARRIVALS eyebrow pill */}
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md border border-white/60 shadow-sm text-[11px] font-bold tracking-widest text-[#191c1e] uppercase mb-3">
                  <span className="text-[#ba0918] text-sm">✦</span>
                  NEW ARRIVALS
                </span>

                <h1 className="text-[clamp(1.2rem,3.5vw,3.25rem)] font-extrabold text-[#191c1e] tracking-tight leading-[1.1] mb-3">
                  {slide.title}
                </h1>

                {slide.subtitle && (
                  <p className="text-[clamp(0.75rem,1.5vw,1.125rem)] text-[#444748] leading-relaxed mb-4 max-w-md">
                    {slide.subtitle}
                  </p>
                )}

                <Link
                  href={slide.ctaTarget ?? "/shop"}
                  className={cn(
                    "inline-flex items-center gap-2",
                    "h-[clamp(36px,4vw,48px)] px-[clamp(16px,3vw,28px)]",
                    "rounded-full bg-[#0D0D0D] text-white",
                    "text-[clamp(11px,1.2vw,14px)] font-bold tracking-wide",
                    "hover:bg-[#262626] transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D0D0D]",
                  )}
                >
                  {ctaLabel}
                  <ArrowRight className="size-[clamp(12px,1.2vw,16px)]" aria-hidden="true" />
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
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5"
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
                  i === current ? "w-6 bg-[#0D0D0D]" : "w-1.5 bg-[#0D0D0D]/30 hover:bg-[#0D0D0D]/60",
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Next arrow ─────────────────────────────────────────────────────── */}
      {sorted.length > 1 && (
        <button
          onClick={() => { next(); resetTimer(); }}
          aria-label="Next slide"
          className={cn(
            "absolute right-4 md:right-5 top-1/2 -translate-y-1/2 z-20",
            "flex h-11 w-11 items-center justify-center rounded-full",
            "bg-white/80 backdrop-blur-md border border-white/80 text-[#191c1e]",
            "shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:bg-white hover:scale-105 active:scale-95",
            "transition-all duration-150",
          )}
        >
          <ChevronRight className="size-5" aria-hidden="true" />
        </button>
      )}
    </section>
  );
}

export function HeroCarouselSkeleton() {
  return (
    <div className="w-full px-5 md:px-8 lg:px-10 pt-4 md:pt-5">
      <Skeleton
        className="w-full rounded-3xl"
        style={{ height: "clamp(220px, 34vw, 490px)" }}
      />
    </div>
  );
}

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? "4%"  : "-4%",  opacity: 0 }),
  center:                  { x: "0%", opacity: 1 },
  exit:  (dir: number) => ({ x: dir > 0 ? "-4%" : "4%",  opacity: 0 }),
};
