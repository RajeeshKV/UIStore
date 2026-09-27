"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { staggerContainer, fadeUp, transitions } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface HeroSectionProps {
  storeName?: string;
}

/**
 * Editorial hero section.
 * Image is a curated lifestyle/product placeholder that Phase 10 can swap
 * for a CMS/settings-driven image. The layout and animation are complete.
 */
export function HeroSection({ storeName }: HeroSectionProps) {
  const shouldReduce = useReducedMotion();

  return (
    <section
      aria-label="Hero"
      className="relative w-full overflow-hidden bg-surface"
    >
      {/* Aspect-ratio wrapper — prevents CLS */}
      <div className="relative w-full aspect-[4/3] sm:aspect-[16/9] md:aspect-[16/7] lg:aspect-[16/6]">
        {/* Background image */}
        <motion.div
          className="absolute inset-0"
          initial={shouldReduce ? false : { opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
        >
          <Image
            src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1600&q=85&auto=format&fit=crop"
            alt="Modern living room with elegant home decor — premium furniture and accessories"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          {/* Gradient overlay — left side only, preserves image color on right */}
          <div
            className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/30 to-transparent"
            aria-hidden="true"
          />
        </motion.div>

        {/* Content */}
        <div className="absolute inset-0 flex items-center">
          <div className="container-x mx-auto w-full">
            <motion.div
              variants={shouldReduce ? undefined : staggerContainer(0.1, 0.2)}
              initial="hidden"
              animate="visible"
              className="max-w-lg"
            >
              {/* Eyebrow */}
              <motion.p
                variants={shouldReduce ? undefined : fadeUp}
                className="text-caption font-semibold tracking-widest uppercase text-white/70 mb-3"
              >
                {storeName ?? "Premium Collection"}
              </motion.p>

              {/* Headline */}
              <motion.h1
                variants={shouldReduce ? undefined : fadeUp}
                className="text-display font-bold text-white leading-[1.05]"
              >
                Modern Living.
                <br />
                <span className="text-white/90">Made Personal.</span>
              </motion.h1>

              {/* Sub-copy */}
              <motion.p
                variants={shouldReduce ? undefined : fadeUp}
                className="mt-4 text-body-lg text-white/75 max-w-sm leading-relaxed"
              >
                Curated home essentials for a more beautiful, intentional everyday life.
              </motion.p>

              {/* CTAs */}
              <motion.div
                variants={shouldReduce ? undefined : fadeUp}
                className="mt-8 flex flex-wrap items-center gap-3"
              >
                <Link
                  href="/shop"
                  className={cn(
                    "inline-flex h-11 items-center gap-2 px-6 rounded-md",
                    "bg-white text-foreground font-medium text-body-sm",
                    "hover:bg-white/90 transition-colors duration-150",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
                  )}
                >
                  Shop Now
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/categories"
                  className={cn(
                    "inline-flex h-11 items-center gap-2 px-6 rounded-md",
                    "border border-white/40 text-white font-medium text-body-sm",
                    "hover:bg-white/10 transition-colors duration-150",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
                  )}
                >
                  Explore Collections
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator — subtle, desktop only */}
        <motion.div
          aria-hidden="true"
          className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-1.5"
          initial={shouldReduce ? false : { opacity: 0, y: -8 }}
          animate={{ opacity: 0.6, y: 0 }}
          transition={{ ...transitions.slow, delay: 1.2 }}
        >
          <span className="text-[10px] font-medium tracking-widest uppercase text-white/60">
            Scroll
          </span>
          <motion.div
            className="w-px h-8 bg-white/40"
            animate={shouldReduce ? {} : { scaleY: [0, 1, 0], originY: 0 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
        </motion.div>
      </div>
    </section>
  );
}

/** Skeleton shown while above-the-fold hero image loads */
export function HeroSectionSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="w-full aspect-[4/3] sm:aspect-[16/9] md:aspect-[16/7] lg:aspect-[16/6] animate-skeleton bg-muted"
    />
  );
}
