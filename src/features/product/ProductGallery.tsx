"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ZoomIn, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { transitions } from "@/lib/motion";
import type { StorefrontImageResponse } from "@/types/api";

interface ProductGalleryProps {
  /** Images to display. Caller is responsible for selecting the correct source
   * (variant images vs product images). This component never mixes sources. */
  images: StorefrontImageResponse[];
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const shouldReduce = useReducedMotion();

  const sorted = [...images]
    .filter((img) => !!img.url)
    .sort((a, b) => {
      if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
      return a.sortOrder - b.sortOrder;
    });

  const [activeIdx, setActiveIdx]       = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [direction, setDirection]       = useState<1 | -1>(1);

  // Reset to first image whenever the image set changes (variant switch)
  useEffect(() => {
    setActiveIdx(0);
    setDirection(1);
  }, [images]);

  const activeImage = sorted[activeIdx];
  const total = sorted.length;

  const go = useCallback(
    (idx: number) => {
      setDirection(idx > activeIdx ? 1 : -1);
      setActiveIdx(Math.max(0, Math.min(total - 1, idx)));
    },
    [activeIdx, total],
  );

  const prev = useCallback(() => go(activeIdx - 1), [activeIdx, go]);
  const next = useCallback(() => go(activeIdx + 1), [activeIdx, go]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (lightboxOpen) {
        if (e.key === "ArrowLeft") prev();
        if (e.key === "ArrowRight") next();
        if (e.key === "Escape") setLightboxOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxOpen, prev, next]);

  if (sorted.length === 0) {
    return (
      <div className="aspect-square w-full rounded-2xl bg-[#F4F5F7] flex items-center justify-center border border-[#E5E7EB]">
        <span className="text-[#5A6578] text-[13px]">No image available</span>
      </div>
    );
  }

  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? "5%" : "-5%", opacity: 0 }),
    center: { x: 0, opacity: 1, transition: transitions.slow },
    exit: (d: number) => ({ x: d > 0 ? "-5%" : "5%", opacity: 0, transition: transitions.fast }),
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Main image — design: rounded-2xl, white bg, hover zoom arrows */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-[#F4F5F7] border border-[#E5E7EB] group">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={activeIdx}
            custom={direction}
            variants={shouldReduce ? undefined : slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="absolute inset-0"
          >
            <Image
              src={activeImage.url!}
              alt={activeImage.altText ?? productName}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-contain object-center p-4"
              priority={activeIdx === 0}
              loading={activeIdx === 0 ? "eager" : "lazy"}
            />
          </motion.div>
        </AnimatePresence>

        {/* Prev / Next — circular white buttons, float on hover */}
        {total > 1 && (
          <>
            <button
              onClick={prev}
              disabled={activeIdx === 0}
              aria-label="Previous image"
              className={cn(
                "absolute left-3 top-1/2 -translate-y-1/2 z-10",
                "flex h-10 w-10 items-center justify-center rounded-full",
                "bg-white border border-[#E5E7EB] shadow-[0_2px_8px_rgba(0,0,0,0.08)] text-[#191c1e]",
                "opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
                "hover:scale-105 active:scale-95 transition-all duration-150",
                "disabled:opacity-0 disabled:pointer-events-none",
              )}
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              onClick={next}
              disabled={activeIdx === total - 1}
              aria-label="Next image"
              className={cn(
                "absolute right-3 top-1/2 -translate-y-1/2 z-10",
                "flex h-10 w-10 items-center justify-center rounded-full",
                "bg-white border border-[#E5E7EB] shadow-[0_2px_8px_rgba(0,0,0,0.08)] text-[#191c1e]",
                "opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
                "hover:scale-105 active:scale-95 transition-all duration-150",
                "disabled:opacity-0 disabled:pointer-events-none",
              )}
            >
              <ChevronRight className="size-5" />
            </button>
          </>
        )}

        {/* Zoom button */}
        <button
          onClick={() => setLightboxOpen(true)}
          aria-label="View full size image"
          className={cn(
            "absolute bottom-3 right-3 z-10",
            "flex h-9 w-9 items-center justify-center rounded-full",
            "bg-white border border-[#E5E7EB] shadow-[0_2px_8px_rgba(0,0,0,0.08)] text-[#444748]",
            "opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
            "hover:text-[#191c1e] transition-all duration-150",
          )}
        >
          <ZoomIn className="size-4" />
        </button>

        {/* Dot indicators */}
        {total > 1 && (
          <div aria-hidden="true" className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {sorted.map((_, i) => (
              <button
                key={i}
                onClick={() => go(i)}
                aria-label={`Go to image ${i + 1}`}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i === activeIdx ? "w-5 bg-[#0D0D0D]" : "w-1.5 bg-[#0D0D0D]/25 hover:bg-[#0D0D0D]/50",
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnails — design: square, border, active=obsidian border */}
      {total > 1 && (
        <div role="group" aria-label="Product image thumbnails" className="flex gap-2 overflow-x-auto pb-1">
          {sorted.map((img, i) => (
            <button
              key={img.id}
              onClick={() => go(i)}
              aria-label={`View image ${i + 1}${img.altText ? `: ${img.altText}` : ""}`}
              aria-current={i === activeIdx ? "true" : undefined}
              className={cn(
                "relative shrink-0 aspect-square w-16 overflow-hidden rounded-xl",
                "border-2 transition-all duration-150",
                i === activeIdx
                  ? "border-[#0D0D0D]"
                  : "border-[#E5E7EB] hover:border-[#c4c7c7]",
                "bg-[#F4F5F7]",
              )}
            >
              <Image
                src={img.url!}
                alt={img.altText ?? `${productName} thumbnail ${i + 1}`}
                fill
                sizes="64px"
                className="object-contain p-1"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Full size: ${activeImage.altText ?? productName}`}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              className="absolute inset-0 bg-black/92 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={transitions.base}
              onClick={() => setLightboxOpen(false)}
              aria-hidden="true"
            />
            <motion.div
              className="relative z-10 w-full max-w-3xl aspect-square"
              initial={shouldReduce ? false : { opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={transitions.slow}
            >
              <Image
                src={activeImage.url!}
                alt={activeImage.altText ?? productName}
                fill
                sizes="(max-width: 768px) 100vw, 768px"
                className="object-contain"
                priority
              />
            </motion.div>
            <button
              onClick={() => setLightboxOpen(false)}
              aria-label="Close full size image"
              className="absolute top-4 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <X className="size-5" />
            </button>
            {total > 1 && (
              <>
                <button onClick={prev} disabled={activeIdx === 0} aria-label="Previous image" className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors disabled:opacity-30">
                  <ChevronLeft className="size-5" />
                </button>
                <button onClick={next} disabled={activeIdx === total - 1} aria-label="Next image" className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors disabled:opacity-30">
                  <ChevronRight className="size-5" />
                </button>
              </>
            )}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function ProductGalleryFallback({ imageUrl, productName }: { imageUrl?: string | null; productName: string }) {
  if (!imageUrl) {
    return (
      <div className="aspect-square w-full rounded-2xl bg-[#F4F5F7] border border-[#E5E7EB] flex items-center justify-center">
        <span className="text-[#5A6578] text-[13px]">No image available</span>
      </div>
    );
  }
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-[#F4F5F7] border border-[#E5E7EB]">
      <Image src={imageUrl} alt={productName} fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-contain p-4" priority />
    </div>
  );
}
