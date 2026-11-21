"use client";

import { useRef } from "react";
import Link from "next/link";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import { ArrowRight } from "lucide-react";

export function PortalCtaSection() {
  const ref = useRef<HTMLElement>(null);
  const prefersReduced = useReducedMotion() ?? false;

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center 0.65"],
  });

  const scale = useTransform(scrollYProgress, [0, 1], [0.94, 1]);
  const rotateX = useTransform(scrollYProgress, [0, 1], [8, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [0.5, 1]);

  return (
    <section
      ref={ref}
      aria-labelledby="portal-cta-heading"
      className="bg-white px-4 pb-20 pt-8 sm:px-6 lg:px-8 lg:pb-28 lg:pt-12"
    >
      <div style={{ perspective: 1200 }} className="mx-auto max-w-345">
        <motion.div
          style={
            prefersReduced
              ? undefined
              : {
                  scale,
                  rotateX,
                  opacity,
                  transformOrigin: "center bottom",
                }
          }
          className="relative overflow-hidden rounded-3xl bg-linear-to-br from-[#7A1F14] via-[#5C150D] to-[#3B0E09] px-6 py-12 text-white shadow-[0_28px_70px_rgba(122,31,20,0.22)] sm:px-12 sm:py-16 lg:flex lg:items-center lg:justify-between lg:gap-12 lg:px-16"
        >
          {/* Warm architectural glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full bg-[#E8710A]/25 blur-[100px]"
          />

          <div className="relative z-10 max-w-2xl">
            <h2
              id="portal-cta-heading"
              className="text-[clamp(1.75rem,3.4vw,2.75rem)] font-black leading-[1.08] tracking-[-0.03em] text-white"
            >
              Ready to turn your business idea into reality?
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-[#F2D9CC] sm:text-base">
              Create an account in minutes, submit your idea to CEDA, and follow
              every step from review to final decision.
            </p>
          </div>

          <div className="relative z-10 mt-8 flex flex-wrap items-center gap-3.5 lg:mt-0 lg:shrink-0">
            <Link
              href="/submit"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#E8710A] px-7 text-sm font-bold text-white shadow-lg shadow-black/20 transition hover:bg-[#D46506] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#F4B58A]"
            >
              <span>Submit your idea</span>
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
            <Link
              href="/track"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/25 bg-white/10 px-6 text-sm font-semibold text-white backdrop-blur-sm transition hover:border-white/50 hover:bg-white/15 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#F4B58A]"
            >
              Track your application
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
