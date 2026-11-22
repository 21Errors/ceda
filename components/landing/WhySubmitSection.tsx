"use client";

import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const manifestoWords =
  "Many brilliant business ideas never get a fair chance to be heard. CEDA built this portal to give Batswana a clear, direct path from a good idea to a funded business.".split(
    " "
  );

function ScrollWord({
  word,
  progress,
  range,
  reducedMotion,
}: {
  word: string;
  progress: MotionValue<number>;
  range: [number, number];
  reducedMotion: boolean;
}) {
  const opacity = useTransform(progress, range, [0, 1]);
  const y = useTransform(progress, range, [16, 0]);

  if (reducedMotion) {
    return <span className="inline-block mr-[0.28em] text-[#331F17]">{word}</span>;
  }

  return (
    <motion.span
      style={{ opacity, y }}
      className="inline-block mr-[0.28em] text-[#331F17] will-change-[opacity,transform]"
    >
      {word}
    </motion.span>
  );
}

const pillars = [
  {
    index: "01",
    stat: "Live Updates",
    statLabel: "Status updates at every step",
    title: "See every step of your application",
    body: "Follow your application in real time, from the first check through expert review to the final decision.",
  },
  {
    index: "02",
    stat: "18-35 yrs",
    statLabel: "Citizen & youth-led focus",
    title: "Made for Batswana entrepreneurs",
    body: "Built for citizen-owned and youth-led businesses that are ready to grow and solve real problems in Botswana.",
  },
  {
    index: "03",
    stat: "No Fees",
    statLabel: "To submit and track",
    title: "Free to apply",
    body: "There is no fee to submit your idea, get feedback from reviewers, or send an updated version.",
  },
];

export function WhySubmitSection() {
  const manifestoRef = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion() ?? false;

  const { scrollYProgress } = useScroll({
    target: manifestoRef,
    offset: ["start 0.85", "end 0.45"],
  });

  return (
    <section
      id="why-submit"
      className="relative bg-white px-4 py-24 sm:px-6 lg:px-8 lg:py-32"
    >
      <div className="mx-auto max-w-345">
        {/* Scroll-scrubbed editorial manifesto */}
        <div ref={manifestoRef} className="max-w-5xl">
          <p className="text-sm font-semibold text-[#7A1F14]">
            Why submit through CEDA
          </p>

          <h2 className="mt-6 text-[clamp(1.85rem,4.2vw,3.5rem)] font-black leading-[1.12] tracking-[-0.03em]">
            {manifestoWords.map((word, index) => {
              const start = index / manifestoWords.length;
              const end = Math.min(1, start + 1 / manifestoWords.length + 0.02);
              return (
                <ScrollWord
                  key={`${word}-${index}`}
                  word={word}
                  progress={scrollYProgress}
                  range={[start, end]}
                  reducedMotion={prefersReduced}
                />
              );
            })}
          </h2>
        </div>

        {/* Hairline-divided editorial pillars with architectural line draw */}
        <div className="relative mt-16 lg:mt-20">
          <motion.div
            aria-hidden="true"
            initial={prefersReduced ? false : { scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: "left" }}
            className="h-px w-full bg-[#7A1F14]/15"
          />

          <div className="grid grid-cols-1 lg:grid-cols-3">
            {pillars.map((pillar, index) => (
              <motion.div
                key={pillar.title}
                initial={prefersReduced ? false : { opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{
                  duration: 0.55,
                  delay: 0.08 + index * 0.08,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="relative flex flex-col border-b border-[#7A1F14]/12 py-8 last:border-b-0 lg:border-b-0 lg:px-10 lg:py-11 lg:first:pl-0 lg:last:pr-0"
              >
                {index > 0 && (
                  <motion.div
                    aria-hidden="true"
                    initial={prefersReduced ? false : { scaleY: 0 }}
                    whileInView={{ scaleY: 1 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{
                      duration: 0.7,
                      delay: 0.16 + index * 0.08,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    style={{ transformOrigin: "top" }}
                    className="pointer-events-none absolute bottom-0 left-0 top-0 hidden w-px bg-[#7A1F14]/12 lg:block"
                  />
                )}

                <span className="font-mono text-xs font-bold tracking-[0.12em] text-[#E8710A]">
                  {pillar.index}
                </span>

                <div className="mt-4">
                  <p className="text-[clamp(2rem,3vw,2.65rem)] font-black leading-none tracking-[-0.03em] text-[#7A1F14] tabular-nums">
                    {pillar.stat}
                  </p>
                  <p className="mt-2 text-xs font-semibold text-[#7F5E4E]">
                    {pillar.statLabel}
                  </p>
                </div>

                <div className="mt-7 border-t border-[#7A1F14]/10 pt-5">
                  <h3 className="text-lg font-bold tracking-tight text-[#331F17] sm:text-xl">
                    {pillar.title}
                  </h3>
                  <p className="mt-2.5 max-w-sm text-sm leading-7 text-[#573E32]">
                    {pillar.body}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            aria-hidden="true"
            initial={prefersReduced ? false : { scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: "left" }}
            className="h-px w-full bg-[#7A1F14]/15"
          />
        </div>

        <div className="mt-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <p className="text-sm text-[#7F5E4E]">
            Want to check eligibility and required documents first?
          </p>
          <Link
            href="/guidelines"
            className="group inline-flex min-h-11 items-center  text-sm font-semibold text-[#7A1F14] transition-colors hover:border-[#7A1F14] hover:underline"
          >
            <span>Who can apply and how to prepare</span>
            <ArrowRight
              aria-hidden="true"
              className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
            />
          </Link>
        </div>
      </div>
    </section>
  );
}
