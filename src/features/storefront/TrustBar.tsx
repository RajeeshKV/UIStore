"use client";

import { Truck, ShieldCheck, RotateCcw, HeadphonesIcon } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { staggerContainer, fadeUp } from "@/lib/motion";
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
    ? `On orders above ₹${threshold.toLocaleString("en-IN")}`
    : "On qualifying orders";

  return [
    {
      icon: <Truck className="size-5" aria-hidden="true" />,
      title: "Free Shipping",
      description: freeShipLabel,
    },
    {
      icon: <ShieldCheck className="size-5" aria-hidden="true" />,
      title: "Secure Payments",
      description: "Razorpay powered",
    },
    {
      icon: <RotateCcw className="size-5" aria-hidden="true" />,
      title: "Easy Returns",
      description: "Hassle-free returns",
    },
    {
      icon: <HeadphonesIcon className="size-5" aria-hidden="true" />,
      title: "Dedicated Support",
      description: "We're here to help",
    },
  ];
}

export function TrustBar({ settings }: TrustBarProps) {
  const shouldReduce = useReducedMotion();
  const benefits = buildBenefits(settings);

  return (
    <section aria-label="Service benefits" className="border-y border-border bg-surface">
      <div className="container-x mx-auto py-6 md:py-8">
        <motion.ul
          role="list"
          variants={shouldReduce ? undefined : staggerContainer(0.08, 0.1)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6"
        >
          {benefits.map((b) => (
            <motion.li
              key={b.title}
              variants={shouldReduce ? undefined : fadeUp}
              className="flex items-start gap-3 md:items-center md:flex-col md:text-center md:gap-2"
            >
              <span className="shrink-0 text-foreground-muted md:text-foreground">
                {b.icon}
              </span>
              <div>
                <p className="text-body-sm font-semibold text-foreground leading-snug">
                  {b.title}
                </p>
                <p className="text-caption text-foreground-muted mt-0.5">
                  {b.description}
                </p>
              </div>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}
