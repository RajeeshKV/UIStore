"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { fadeUp, scaleIn, staggerContainer } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface EditorialBannerConfig {
  eyebrow?: string;
  heading: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  imageUrl: string;
  imageAlt: string;
  /** "left" = image left, text right; "right" = text left, image right */
  layout?: "left" | "right";
}

/**
 * Full-width editorial promotional section.
 * Config is static here — easy to make settings-driven in a future phase
 * (e.g. fetch from store config or a CMS field).
 */

const DEFAULT_CONFIG: EditorialBannerConfig = {
  eyebrow: "New Collection",
  heading: "Elevate Your Space With Timeless Pieces",
  body: "Premium designs. Everyday comfort. Discover furniture and accessories that transform any room into a sanctuary.",
  ctaLabel: "Explore New Arrivals",
  ctaHref: "/shop?sort=newest",
  imageUrl:
    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200&q=80&auto=format&fit=crop",
  imageAlt:
    "Elegant living room sofa with cushions — premium home furnishing collection",
  layout: "right",
};

interface EditorialBannerProps {
  config?: Partial<EditorialBannerConfig>;
}

export function EditorialBanner({ config }: EditorialBannerProps) {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const shouldReduce = useReducedMotion();
  const isImageLeft = cfg.layout === "left";

  return (
    <section
      aria-labelledby="editorial-heading"
      className="relative overflow-hidden bg-foreground text-primary-foreground"
    >
      <div
        className={cn(
          "container-x mx-auto grid md:grid-cols-2 items-center",
          "min-h-[420px] md:min-h-[480px]",
          "py-14 md:py-0",
        )}
      >
        {/* Text content */}
        <motion.div
          variants={shouldReduce ? undefined : staggerContainer(0.1, 0.1)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className={cn(
            "relative z-10 flex flex-col gap-5 py-10 md:py-16",
            isImageLeft ? "md:order-2" : "md:order-1",
          )}
        >
          {cfg.eyebrow && (
            <motion.p
              variants={shouldReduce ? undefined : fadeUp}
              className="text-caption font-semibold tracking-widest uppercase text-white/60"
            >
              {cfg.eyebrow}
            </motion.p>
          )}

          <motion.h2
            id="editorial-heading"
            variants={shouldReduce ? undefined : fadeUp}
            className="text-h2 font-bold text-white leading-tight"
          >
            {cfg.heading}
          </motion.h2>

          <motion.p
            variants={shouldReduce ? undefined : fadeUp}
            className="text-body text-white/70 max-w-sm leading-relaxed"
          >
            {cfg.body}
          </motion.p>

          <motion.div variants={shouldReduce ? undefined : fadeUp}>
            <Link
              href={cfg.ctaHref}
              className={cn(
                "inline-flex items-center gap-2 h-11 px-6 rounded-md",
                "bg-white text-foreground font-medium text-body-sm",
                "hover:bg-white/90 transition-colors duration-150",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
              )}
            >
              {cfg.ctaLabel}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </motion.div>
        </motion.div>

        {/* Image */}
        <motion.div
          variants={shouldReduce ? undefined : scaleIn}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className={cn(
            "relative",
            isImageLeft ? "md:order-1" : "md:order-2",
            // On mobile: full-width negative margin image strip above text
            "-mx-[var(--spacing-container-x)] md:mx-0",
            "aspect-[16/9] md:aspect-auto md:h-full md:absolute md:inset-y-0",
            isImageLeft
              ? "md:left-0 md:right-1/2"
              : "md:left-1/2 md:right-0",
          )}
        >
          <Image
            src={cfg.imageUrl}
            alt={cfg.imageAlt}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover object-center"
            loading="lazy"
          />
          {/* Inner gradient to blend with dark bg */}
          <div
            className={cn(
              "absolute inset-0",
              isImageLeft
                ? "bg-gradient-to-l from-foreground/60 via-foreground/20 to-transparent"
                : "bg-gradient-to-r from-foreground/60 via-foreground/20 to-transparent",
            )}
            aria-hidden="true"
          />
        </motion.div>
      </div>
    </section>
  );
}
