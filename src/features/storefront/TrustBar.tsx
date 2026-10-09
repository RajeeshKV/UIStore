"use client";

import { Truck, ShieldCheck, RotateCcw, HeadphonesIcon } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import type { PublicBusinessSettingsResponse } from "@/types/api";

interface TrustBarProps {
  settings?: PublicBusinessSettingsResponse | null;
}

interface Benefit {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function buildBenefits(settings?: PublicBusinessSettingsResponse | null): Benefit[] {
  const threshold = settings?.delivery?.freeShippingThreshold;
  const freeShipLabel = threshold
    ? `Above ₹${threshold.toLocaleString("en-IN")}`
    : "On qualifying orders";

  return [
    { icon: <Truck className="size-4" />,           title: "Free Shipping",   description: freeShipLabel },
    { icon: <ShieldCheck className="size-4" />,     title: "Secure Payments", description: "Razorpay powered" },
    { icon: <RotateCcw className="size-4" />,       title: "Easy Returns",    description: "Hassle-free" },
    { icon: <HeadphonesIcon className="size-4" />,  title: "Support 24/7",    description: "We're here to help" },
  ];
}

export function TrustBar({ settings }: TrustBarProps) {
  const shouldReduce = useReducedMotion();
  const benefits = buildBenefits(settings);

  return (
    <section aria-label="Service benefits" className="w-full px-5 md:px-8 lg:px-10 py-3 md:py-4">
      <motion.div
        initial={shouldReduce ? undefined : { opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-20px" }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="bg-surface-elevated rounded-2xl border border-border/50 shadow-[0_4px_20px_rgba(0,0,0,0.03)] px-3 py-3 md:px-5 md:py-4"
      >
        <ul role="list" className="grid grid-cols-2 md:grid-cols-4 gap-0">
          {benefits.map((b, i) => (
            <motion.li
              key={b.title}
              initial={shouldReduce ? undefined : { opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.2, delay: i * 0.05 }}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2.5",
                i < 2 && "max-md:border-b max-md:border-border/40",
                "md:border-r md:border-border/60 last:md:border-r-0",
                "first:md:pl-0 last:md:pr-0",
              )}
            >
              <div
                className="w-8 h-8 rounded-xl shrink-0 bg-muted border border-border/40 flex items-center justify-center text-foreground"
                aria-hidden="true"
              >
                {b.icon}
              </div>
              <div className="min-w-0 overflow-hidden">
                <p className="text-[11px] md:text-[12px] font-bold text-foreground truncate leading-tight">
                  {b.title}
                </p>
                <p className="text-[10px] md:text-[11px] text-foreground-muted truncate leading-tight mt-0.5">
                  {b.description}
                </p>
              </div>
            </motion.li>
          ))}
        </ul>
      </motion.div>
    </section>
  );
}
