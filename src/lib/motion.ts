/**
 * Shopey – Motion System
 *
 * Centralised animation variants for Motion (Framer Motion).
 * All durations/easings here must mirror the CSS token values in globals.css.
 * Components import from this file — never inline animation objects ad-hoc.
 */

import type { Variants, Transition } from "motion/react";

// ── Transitions ──────────────────────────────────────────────────────────────

export const transitions = {
  fast: { duration: 0.15, ease: [0.16, 1, 0.3, 1] } satisfies Transition,
  base: { duration: 0.2,  ease: [0.16, 1, 0.3, 1] } satisfies Transition,
  slow: { duration: 0.3,  ease: [0.16, 1, 0.3, 1] } satisfies Transition,
  slower: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } satisfies Transition,
  spring: { type: "spring", stiffness: 400, damping: 30 } satisfies Transition,
  springGentle: { type: "spring", stiffness: 200, damping: 25 } satisfies Transition,
} as const;

// ── Variants ─────────────────────────────────────────────────────────────────

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: transitions.base },
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: transitions.slow },
};

export const fadeDown: Variants = {
  hidden: { opacity: 0, y: -12 },
  visible: { opacity: 1, y: 0, transition: transitions.slow },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: transitions.base },
};

export const slideInRight: Variants = {
  hidden: { x: "100%" },
  visible: { x: 0, transition: transitions.slow },
  exit: { x: "100%", transition: { ...transitions.slow, ease: [0.7, 0, 0.84, 0] } },
};

export const slideInLeft: Variants = {
  hidden: { x: "-100%" },
  visible: { x: 0, transition: transitions.slow },
  exit: { x: "-100%", transition: { ...transitions.slow, ease: [0.7, 0, 0.84, 0] } },
};

/** Stagger children with a short delay between each */
export const staggerContainer = (
  staggerChildren = 0.07,
  delayChildren = 0,
): Variants => ({
  hidden: {},
  visible: {
    transition: { staggerChildren, delayChildren },
  },
});

export const overlayBackdrop: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: transitions.base },
  exit: { opacity: 0, transition: transitions.fast },
};

export const modalPanel: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 8 },
  visible: { opacity: 1, scale: 1, y: 0, transition: transitions.slow },
  exit: { opacity: 0, scale: 0.96, y: 8, transition: transitions.fast },
};

export const toastVariants: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1, transition: transitions.slow },
  exit: { opacity: 0, y: -8, scale: 0.96, transition: transitions.fast },
};
