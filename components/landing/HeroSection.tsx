"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Search, ArrowDown } from "lucide-react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";

const ease = [0.22, 1, 0.36, 1] as const;

export function HeroSection() {
  const heroRef = useRef<HTMLElement>(null);
  const prefersReduced = useReducedMotion() ?? false;

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const artworkY = useTransform(scrollYProgress, [0, 1], [0, 72]);
  const artworkScale = useTransform(scrollYProgress, [0, 1], [1, 1.06]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -32]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0.4]);
  const arrowOpacity = useTransform(scrollYProgress, [0, 0.22], [1, 0]);

  return (
    <section
      ref={heroRef}
      className="relative isolate mx-3 my-4 flex min-h-[min(100dvh,720px)] max-w-[1380px] flex-col justify-center overflow-hidden rounded-2xl border border-[#7A1F14]/10 bg-gradient-to-b from-[#FFF6EE] via-[#FFF0E2] to-[#F6DCCB] px-4 sm:mx-6 sm:my-6 sm:px-8 lg:mx-auto lg:min-h-[min(76dvh,760px)] lg:px-12"
    >
      {/* =========================================================================
          BACKGROUND GRAPHICAL PATTERNS (Sampled from Reference)
      ========================================================================== */}
      {/* 1. Dotted pattern in top-left corner */}
      <div
        className="pointer-events-none absolute left-0 top-0 h-56 w-56 opacity-20 sm:h-80 sm:w-80 sm:opacity-40"
        style={{
          backgroundImage: `radial-gradient(#7A1F14 1.2px, transparent 1.2px)`,
          backgroundSize: "20px 20px",
        }}
      />

      {/* 2. Soft blurred warmth radial glow behind the hero */}
      <div className="pointer-events-none absolute right-1/4 top-1/4 h-[600px] w-[600px] rounded-full bg-[#E8710A]/15 blur-[100px]" />
      <div className="pointer-events-none absolute right-10 top-10 h-[450px] w-[450px] rounded-full bg-[#F4B58A]/30 blur-[90px]" />

      {/* Warm light behind the decorative GIF */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 z-0 hidden w-[72%] md:block"
        style={{
          background:
            "radial-gradient(ellipse at 70% 48%, rgba(244, 181, 138, 0.4) 0%, transparent 70%)",
        }}
      />

      {/* 3. Diagonal line pattern in bottom-left corner */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 h-40 w-40 opacity-[0.04] sm:h-64 sm:w-64 sm:opacity-10"
        style={{
          backgroundImage: `repeating-linear-gradient(45deg, #7A1F14, #7A1F14 1.5px, transparent 1.5px, transparent 14px)`,
        }}
      />

      {/* 4. Diagonal line pattern in bottom-right corner */}
      <div
        className="pointer-events-none absolute bottom-0 right-0 h-44 w-44 opacity-[0.08] sm:h-72 sm:w-72 sm:opacity-20"
        style={{
          backgroundImage: `repeating-linear-gradient(-45deg, #E8710A, #E8710A 1.5px, transparent 1.5px, transparent 16px)`,
        }}
      />

      {/* Decorative hero animation with subtle scroll parallax */}
      <motion.div
        aria-hidden="true"
        style={
          prefersReduced
            ? undefined
            : {
                y: artworkY,
                scale: artworkScale,
              }
        }
        className="pointer-events-none absolute inset-y-0 right-0 z-0 hidden w-[68%] overflow-hidden opacity-30 mix-blend-multiply md:block"
      >
        <Image
          src="/assets/hero-animation.webp"
          alt=""
          width={800}
          height={533}
          unoptimized
          className="h-full w-full scale-110 object-cover object-center sepia-[.12] saturate-[.85]"
          style={{
            maskImage:
              "radial-gradient(ellipse 56% 58% at 76% 42%, #000 18%, rgb(0 0 0 / 72%) 58%, transparent 100%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 56% 58% at 76% 42%, #000 18%, rgb(0 0 0 / 72%) 58%, transparent 100%)",
          }}
        />
      </motion.div>

      {/* =========================================================================
          MAIN HERO CONTENT (Vertically Centered, Left Aligned)
      ========================================================================== */}
      <motion.div
        style={
          prefersReduced
            ? undefined
            : {
                y: contentY,
                opacity: contentOpacity,
              }
        }
        className="relative mx-auto w-full max-w-7xl py-12 lg:py-20"
      >
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
          {/* Left Column: Headlines & Call to Actions */}
          <div className="z-10 space-y-5 text-center lg:col-span-7 lg:space-y-6 lg:text-left xl:col-span-6">
            {/* Large Two-Tone Headline with masked line-rise entrance */}
            <h1 className="text-[clamp(2.35rem,11vw,3.75rem)] font-black leading-[0.92] tracking-tight lg:text-[72px]">
              <span className="block overflow-hidden pb-1">
                <motion.span
                  initial={prefersReduced ? false : { y: "105%", opacity: 0 }}
                  animate={{ y: "0%", opacity: 1 }}
                  transition={{ duration: 0.62, ease }}
                  className="block text-[#7A1F14]"
                >
                  INNOVATION
                </motion.span>
              </span>
              <span className="mt-0.5 block overflow-hidden pb-1">
                <motion.span
                  initial={prefersReduced ? false : { y: "105%", opacity: 0 }}
                  animate={{ y: "0%", opacity: 1 }}
                  transition={{ duration: 0.62, delay: 0.1, ease }}
                  className="block text-[#E8710A]"
                >
                  PORTAL
                </motion.span>
              </span>
            </h1>

            {/* Subheading in bold */}
            <motion.h2
              initial={prefersReduced ? false : { y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.55, delay: 0.2, ease }}
              className="text-lg font-black tracking-tight text-[#37231A] sm:text-2xl"
            >
              Innovate. Build. Transform.
            </motion.h2>

            {/* Description */}
            <motion.p
              initial={prefersReduced ? false : { y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.55, delay: 0.3, ease }}
              className="mx-auto max-w-lg text-sm leading-relaxed text-[#573E32] sm:text-base lg:mx-0"
            >
              The official Citizen Entrepreneurial Development Agency online
              portal. Submit your business ideas, get feedback from experienced
              reviewers, and access funding to help grow Botswana’s economy.
            </motion.p>

            {/* Primary routes */}
            <motion.div
              initial={prefersReduced ? false : { y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.55, delay: 0.38, ease }}
              className="flex flex-col items-center justify-center gap-3.5 pt-2 sm:flex-row lg:justify-start"
            >
              <Link
                href="/submit"
                className="inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-[#7A1F14] px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#7A1F14]/25 transition-all hover:bg-[#60170E] hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1F14] active:scale-[0.98] sm:w-auto"
              >
                <span>Submit Idea</span>
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/track"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#7A1F14]/30 bg-white/70 px-6 py-3.5 text-sm font-bold text-[#7A1F14] shadow-sm backdrop-blur-sm transition hover:border-[#7A1F14] hover:bg-white sm:w-auto"
              >
                <Search className="h-4 w-4 text-[#7A1F14]" />
                <span>Track Submission</span>
              </Link>
            </motion.div>
          </div>

          {/* Right Column spacer preserves the existing hero text layout */}
          <div
            className="hidden lg:col-span-5 lg:block xl:col-span-6"
            aria-hidden="true"
          />
        </div>
      </motion.div>

      {/* =========================================================================
          SCROLL-DOWN ARROW (Fades out smoothly as you scroll)
      ========================================================================== */}
      <motion.div
        style={prefersReduced ? undefined : { opacity: arrowOpacity }}
        className="absolute bottom-6 left-1/2 z-20 -translate-x-1/2"
      >
        <Link
          href="/#why-submit"
          aria-label="Scroll down"
          className="animate-scroll-bounce flex h-9 w-9 items-center justify-center rounded-full border border-[#7A1F14] text-[#7A1F14] shadow-sm transition hover:bg-[#7A1F14] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1F14]"
        >
          <ArrowDown className="h-4 w-4" />
        </Link>
      </motion.div>
    </section>
  );
}
