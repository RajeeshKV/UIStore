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
    <section aria-label="Service benefits" className="bg-surface">
      <div className="container-x mx-auto py-2.5">
        <motion.ul
          role="list"
          variants={shouldReduce ? undefined : staggerContainer(0.06, 0.05)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-20px" }}
          className="flex items-center justify-between gap-2 flex-wrap"
        >
          {benefits.map((b) => (
            <motion.li
              key={b.title}
              variants={shouldReduce ? undefined : fadeUp}
              className="flex items-center gap-2 text-foreground-muted"
            >
              <span className="shrink-0 [&>svg]:size-3.5" aria-hidden="true">
                {b.icon}
              </span>
              <p className="text-[11px] font-medium text-foreground-muted whitespace-nowrap">
                {b.title}
                <span className="hidden sm:inline text-foreground-muted/60"> — {b.description}</span>
              </p>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}
