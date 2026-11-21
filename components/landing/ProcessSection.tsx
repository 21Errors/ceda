"use client";

import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const stages = [
  {
    step: "01",
    title: "Create your account and submit",
    summary:
      "Fill out a simple online form explaining the problem you solve, who your customers are, who is on your team, and any helpful links.",
    outcome: "You get a tracking code right away",
  },
  {
    step: "02",
    title: "Basic requirements check",
    summary:
      "CEDA checks that your business meets citizen ownership rules and that your form has all the details reviewers need.",
    outcome: "Quick check with status updates",
  },
  {
    step: "03",
    title: "Review by independent experts",
    summary:
      "Specialists review your idea based on how new it is, whether it can make money, whether your team can build it, and how it benefits Botswana.",
    outcome: "Fair, detailed scoring",
  },
  {
    step: "04",
    title: "Feedback and chance to update",
    summary:
      "If reviewers need more information or clearer numbers, they send you notes so you can update your application without starting over.",
    outcome: "Clear notes to strengthen your plan",
  },
  {
    step: "05",
    title: "Final decision and funding path",
    summary:
      "The strongest ideas move to the final decision stage for grant awards, competition prizes, or CEDA business funding.",
    outcome: "Clear final decision sent to you",
  },
];

function TimelineStageItem({
  stage,
  index,
  total,
  progress,
  reducedMotion,
}: {
  stage: (typeof stages)[number];
  index: number;
  total: number;
  progress: MotionValue<number>;
  reducedMotion: boolean;
}) {
  const start = index === 0 ? 0 : (index - 0.1) / total;
  const end = Math.min(1, start + 0.16);

  const opacity = useTransform(progress, [start, end], [0, 1]);
  const y = useTransform(progress, [start, end], [28, 0]);
  const rotateX = useTransform(progress, [start, end], [14, 0]);
  const nodeScale = useTransform(progress, [start, end], [0.6, 1]);

  return (
    <li
      style={{ perspective: 900 }}
      className="relative pb-10 pl-14 last:pb-0 sm:pb-12 sm:pl-16"
    >
      {/* Step Node */}
      <motion.span
        style={
          reducedMotion
            ? undefined
            : {
                opacity,
                scale: nodeScale,
              }
        }
        className="absolute left-0 top-0.5 flex h-10 w-10 items-center justify-center rounded-full border border-[#7A1F14]/30 bg-white font-mono text-xs font-bold text-[#7A1F14] sm:h-12 sm:w-12 sm:text-sm"
      >
        {stage.step}
      </motion.span>

      <motion.div
        style={
          reducedMotion
            ? undefined
            : {
                opacity,
                y,
                rotateX,
                transformOrigin: "top center",
              }
        }
        className={
          index < total - 1
            ? "border-b border-[#7A1F14]/12 pb-10 sm:pb-12"
            : ""
        }
      >
        <h3 className="text-xl font-bold tracking-tight text-[#331F17] sm:text-2xl">
          {stage.title}
        </h3>
        <p className="mt-3 max-w-xl text-sm leading-7 text-[#573E32] sm:text-base">
          {stage.summary}
        </p>
        <p className="mt-4 text-xs font-semibold text-[#7A1F14]">
          {stage.outcome}
        </p>
      </motion.div>
    </li>
  );
}

export function ProcessSection() {
  const timelineRef = useRef<HTMLOListElement>(null);
  const prefersReduced = useReducedMotion() ?? false;

  const { scrollYProgress } = useScroll({
    target: timelineRef,
    offset: ["start 0.78", "end 0.72"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 180,
    damping: 28,
    restDelta: 0.001,
  });

  return (
    <section
      id="process"
      className="relative border-t border-[#7A1F14]/10 bg-white px-4 py-24 sm:px-6 lg:px-8 lg:py-32"
    >
      <div className="relative mx-auto max-w-345">
        <div className="grid grid-cols-1 gap-14 lg:grid-cols-12 lg:gap-16">
          {/* Sticky Left Narrative Column */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-28">
              <p className="text-sm font-semibold text-[#7A1F14]">
                How the process works
              </p>
              <h2 className="mt-3 text-[clamp(2rem,4vw,3.25rem)] font-black leading-[1.06] tracking-[-0.03em] text-[#331F17]">
                Five simple steps from idea to decision.
              </h2>
              <p className="mt-5 max-w-md text-sm leading-7 text-[#573E32] sm:text-base">
                Every application follows the same clear steps. You always know
                where your idea is in the process and what happens next.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3.5">
                <Link
                  href="/submit"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#7A1F14] px-7 text-sm font-bold text-white transition hover:bg-[#5C150D] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#E8710A]"
                >
                  <span>Start your application</span>
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </Link>
                <Link
                  href="/track"
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#7A1F14]/25 bg-white px-6 text-sm font-semibold text-[#7A1F14] transition hover:border-[#7A1F14] hover:bg-[#FFF7F0] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#E8710A]"
                >
                  Track an existing idea
                </Link>
              </div>
            </div>
          </div>

          {/* Right Scroll-Linked 5-Stage Sequence */}
          <div className="relative lg:col-span-7">
            {/* Vertical progress line drawn on scroll */}
            <div
              aria-hidden="true"
              className="absolute bottom-8 left-5 top-6 w-px sm:left-6"
            >
              <motion.div
                style={{
                  scaleY: prefersReduced ? 1 : smoothProgress,
                  transformOrigin: "top",
                }}
                className="h-full w-full bg-[#7A1F14]/45"
              />
            </div>

            <ol ref={timelineRef} className="space-y-2">
              {stages.map((stage, index) => (
                <TimelineStageItem
                  key={stage.step}
                  stage={stage}
                  index={index}
                  total={stages.length}
                  progress={smoothProgress}
                  reducedMotion={prefersReduced}
                />
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
