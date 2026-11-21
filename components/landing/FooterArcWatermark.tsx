"use client";

import { motion, useReducedMotion } from "motion/react";

const ease = [0.22, 1, 0.36, 1] as const;

export function FooterArcWatermark() {
  const prefersReduced = useReducedMotion() ?? false;

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 560 320"
      fill="none"
      className="pointer-events-none absolute -right-24 -top-12 h-64 w-[28rem] opacity-[0.07] sm:h-80 sm:w-[36rem]"
    >
      <motion.path
        d="M36 286C74 128 214 26 368 42C450 50 516 96 548 168"
        stroke="#F4B58A"
        strokeWidth="44"
        strokeLinecap="round"
        initial={prefersReduced ? false : { pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 1 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 1.15, ease }}
      />
      <motion.path
        d="M112 288C164 202 276 154 398 176C456 186 502 216 534 256"
        stroke="#E8710A"
        strokeWidth="22"
        strokeLinecap="round"
        initial={prefersReduced ? false : { pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 1 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 1.15, delay: 0.18, ease }}
      />
    </svg>
  );
}
