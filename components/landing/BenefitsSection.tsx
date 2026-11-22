"use client";

import { useEffect, useRef, type ComponentType } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import {
  AdvisorChatIllustration,
  FairReviewIllustration,
  FeedbackLoopIllustration,
  FundingIllustration,
} from "@/components/landing/BenefitsIllustrations";

type BentoArea = "funding" | "review" | "feedback" | "advisors";

interface BenefitCardItem {
  id: BentoArea;
  title: string;
  description: string;
  Illustration: ComponentType;
}

const titleWords =
  "More than an application form. Real support to help your business grow.".split(
    " "
  );

const benefits: BenefitCardItem[] = [
  {
    id: "funding",
    title: "Access to business funding",
    description:
      "Approved ideas can qualify for CEDA loans, innovation grants, and business support to help you launch and grow across Botswana.",
    Illustration: FundingIllustration,
  },
  {
    id: "review",
    title: "Fair review by experienced reviewers",
    description:
      "Experienced reviewers score your idea using clear standards: whether it can work, whether customers need it, and how it helps Botswana.",
    Illustration: FairReviewIllustration,
  },
  {
    id: "feedback",
    title: "Helpful feedback and a chance to improve",
    description:
      "If reviewers see something missing, your application is not simply rejected. You get clear notes and can submit an improved version right in the portal.",
    Illustration: FeedbackLoopIllustration,
  },
  {
    id: "advisors",
    title: "Direct help from CEDA advisors",
    description:
      "Chat with a CEDA advisor during working hours if you have questions about who can apply, what documents you need, or how to prepare.",
    Illustration: AdvisorChatIllustration,
  },
];

function ScrollTitleWord({
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
  const y = useTransform(progress, range, [18, 0]);

  if (reducedMotion) {
    return (
      <span className="mr-[0.26em] inline-block text-[#331F17]">{word}</span>
    );
  }

  return (
    <motion.span
      style={{ opacity, y }}
      className="mr-[0.26em] inline-block text-[#331F17] will-change-[opacity,transform]"
    >
      {word}
    </motion.span>
  );
}

function BentoCard({
  item,
  progress,
  reducedMotion,
}: {
  item: BenefitCardItem;
  progress: MotionValue<number>;
  reducedMotion: boolean;
}) {
  const Illustration = item.Illustration;

  // 1. Top-left ("funding"): enters from left edge and locks cleanly into place at 0.34 (z-30)
  // Carries an elevated ambient shadow while stacked cards deal out from under it, then settles flat
  const fundingX = useTransform(progress, [0, 0.34], ["-52vw", "0vw"]);
  const fundingOpacity = useTransform(progress, [0, 0.14], [0, 1]);
  const fundingScale = useTransform(progress, [0, 0.34], [0.96, 1]);
  const fundingShadowAlpha = useTransform(
    progress,
    [0.26, 0.38, 0.72, 0.86],
    [0, 0.18, 0.14, 0]
  );
  const fundingShadowY = useTransform(
    progress,
    [0.26, 0.38, 0.72, 0.86],
    [0, 22, 16, 0]
  );
  const fundingShadowBlur = useTransform(
    progress,
    [0.26, 0.38, 0.72, 0.86],
    [0, 48, 36, 0]
  );
  const fundingBoxShadow = useMotionTemplate`0 ${fundingShadowY}px ${fundingShadowBlur}px -10px rgba(51, 31, 23, ${fundingShadowAlpha})`;

  // 2. Top-right ("review"): waits until "funding" locks in (0.34), then deals right from under it
  // with 3D recessed scale, subtle perspective hinge, depth blur, and cast left-edge shadow
  const reviewX = useTransform(progress, [0.36, 0.74], ["-92%", "0%"]);
  const reviewY = useTransform(progress, [0.36, 0.74], [12, 0]);
  const reviewScale = useTransform(progress, [0.36, 0.74], [0.9, 1]);
  const reviewRotateY = useTransform(progress, [0.36, 0.74], [10, 0]);
  const reviewRotate = useTransform(progress, [0.36, 0.74], [-1.5, 0]);
  const reviewOpacity = useTransform(progress, [0.34, 0.46], [0, 1]);
  const reviewBlurPx = useTransform(progress, [0.36, 0.7], [10, 0]);
  const reviewFilter = useMotionTemplate`blur(${reviewBlurPx}px)`;
  const reviewUnderShadowOpacity = useTransform(progress, [0.36, 0.74], [1, 0]);

  // 3. Bottom-left ("feedback"): waits until "funding" locks in (0.34), then deals down from under it
  // with 3D recessed scale, subtle perspective hinge, depth blur, and cast top-edge shadow
  const feedbackY = useTransform(progress, [0.38, 0.78], ["-92%", "0%"]);
  const feedbackX = useTransform(progress, [0.38, 0.78], [12, 0]);
  const feedbackScale = useTransform(progress, [0.38, 0.78], [0.9, 1]);
  const feedbackRotateX = useTransform(progress, [0.38, 0.78], [-10, 0]);
  const feedbackRotate = useTransform(progress, [0.38, 0.78], [1.2, 0]);
  const feedbackOpacity = useTransform(progress, [0.36, 0.48], [0, 1]);
  const feedbackBlurPx = useTransform(progress, [0.38, 0.74], [10, 0]);
  const feedbackFilter = useMotionTemplate`blur(${feedbackBlurPx}px)`;
  const feedbackUnderShadowOpacity = useTransform(
    progress,
    [0.38, 0.78],
    [1, 0]
  );

  // 4. Bottom-right ("advisors"): glides cleanly in from the right edge of the screen (z-10)
  const advisorsX = useTransform(progress, [0.5, 0.9], ["52vw", "0vw"]);
  const advisorsOpacity = useTransform(progress, [0.5, 0.68], [0, 1]);
  const advisorsScale = useTransform(progress, [0.5, 0.9], [0.96, 1]);

  const cardMotionStyle = reducedMotion
    ? undefined
    : item.id === "funding"
      ? {
          x: fundingX,
          opacity: fundingOpacity,
          scale: fundingScale,
          boxShadow: fundingBoxShadow,
        }
      : item.id === "review"
        ? {
            x: reviewX,
            y: reviewY,
            scale: reviewScale,
            rotateY: reviewRotateY,
            rotate: reviewRotate,
            opacity: reviewOpacity,
            filter: reviewFilter,
            transformOrigin: "left center",
          }
        : item.id === "feedback"
          ? {
              x: feedbackX,
              y: feedbackY,
              scale: feedbackScale,
              rotateX: feedbackRotateX,
              rotate: feedbackRotate,
              opacity: feedbackOpacity,
              filter: feedbackFilter,
              transformOrigin: "top center",
            }
          : {
              x: advisorsX,
              opacity: advisorsOpacity,
              scale: advisorsScale,
            };

  const zIndexClass =
    item.id === "funding"
      ? "z-30"
      : item.id === "review" || item.id === "feedback"
        ? "z-20"
        : "z-10";

  return (
    <motion.article
      data-bento-area={item.id}
      style={cardMotionStyle}
      className={`benefits-bento-card ${zIndexClass} group relative rounded-2xl border border-[#7A1F14]/12 bg-white text-[#331F17] transition-[border-color,box-shadow] duration-200 will-change-[transform,opacity,filter] hover:border-[#7A1F14]/24 hover:shadow-[0_10px_28px_rgba(51,31,23,0.06)]`}
    >
      {/* 3D cast shadow from the top-left card as stacked cards emerge from underneath */}
      {!reducedMotion && item.id === "review" ? (
        <motion.div
          aria-hidden="true"
          style={{ opacity: reviewUnderShadowOpacity }}
          className="pointer-events-none absolute inset-0 z-20 rounded-2xl"
        >
          <div
            className="h-full w-full rounded-2xl"
            style={{
              background:
                "linear-gradient(to right, rgba(51,31,23,0.22) 0%, rgba(51,31,23,0.08) 28%, transparent 65%)",
            }}
          />
        </motion.div>
      ) : null}

      {!reducedMotion && item.id === "feedback" ? (
        <motion.div
          aria-hidden="true"
          style={{ opacity: feedbackUnderShadowOpacity }}
          className="pointer-events-none absolute inset-0 z-20 rounded-2xl"
        >
          <div
            className="h-full w-full rounded-2xl"
            style={{
              background:
                "linear-gradient(to bottom, rgba(51,31,23,0.22) 0%, rgba(51,31,23,0.08) 28%, transparent 65%)",
            }}
          />
        </motion.div>
      ) : null}

      <div className="benefits-bento-card-inner p-6 sm:p-7">
        <div className="benefits-bento-visual flex flex-col">
          <Illustration />
        </div>

        <div className="benefits-bento-body">
          <h3 className="text-lg font-bold leading-snug tracking-tight text-[#331F17] sm:text-xl">
            {item.title}
          </h3>

          <p className="mt-2.5 max-w-xl text-sm leading-7 text-[#573E32]">
            {item.description}
          </p>
        </div>
      </div>
    </motion.article>
  );
}

export function BenefitsSection() {
  const titleRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion() ?? false;

  // Title animates while visibly in the viewport (start at 85%, completes at 62% of viewport)
  const { scrollYProgress: titleScroll } = useScroll({
    target: titleRef,
    offset: ["start 0.85", "end 0.62"],
  });

  // Bento grid starts right as the title completes (~68% of viewport) and finishes while all 4 cards are in view
  const { scrollYProgress: gridScroll } = useScroll({
    target: gridRef,
    offset: ["start 0.68", "center 0.56"],
  });

  // Monotonic high-water-mark progress: scroll-driven going down, never reverses/blurs when scrolling back up to read
  const titleMax = useMotionValue(0);
  const gridMax = useMotionValue(0);

  useMotionValueEvent(titleScroll, "change", (latest) => {
    if (latest > titleMax.get()) {
      titleMax.set(latest);
    }
  });

  useMotionValueEvent(gridScroll, "change", (latest) => {
    if (latest > gridMax.get()) {
      gridMax.set(latest);
    }
  });

  useEffect(() => {
    const initialTitle = titleScroll.get();
    if (initialTitle > titleMax.get()) {
      titleMax.set(initialTitle);
    }
    const initialGrid = gridScroll.get();
    if (initialGrid > gridMax.get()) {
      gridMax.set(initialGrid);
    }
  }, [titleScroll, titleMax, gridScroll, gridMax]);

  const smoothTitleProgress = useSpring(titleMax, {
    stiffness: 170,
    damping: 26,
    mass: 0.4,
    restDelta: 0.001,
  });

  const smoothGridProgress = useSpring(gridMax, {
    stiffness: 145,
    damping: 24,
    mass: 0.45,
    restDelta: 0.001,
  });

  const eyebrowOpacity = useTransform(smoothTitleProgress, [0, 0.25], [0, 1]);
  const eyebrowY = useTransform(smoothTitleProgress, [0, 0.25], [12, 0]);

  return (
    <section
      id="benefits"
      className="relative overflow-clip bg-[#FFF7F0] px-4 py-24 sm:px-6 lg:px-8 lg:py-32"
    >
      <div className="mx-auto max-w-345">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-end">
          <div ref={titleRef} className="lg:col-span-7">
            <motion.p
              style={
                prefersReduced
                  ? undefined
                  : { opacity: eyebrowOpacity, y: eyebrowY }
              }
              className="text-sm font-semibold text-[#E8710A]"
            >
              What you get when you apply
            </motion.p>

            <h2 className="mt-3 text-[clamp(2rem,4vw,3.25rem)] font-black leading-[1.06] tracking-[-0.03em] text-[#331F17]">
              {titleWords.map((word, index) => {
                const start = 0.08 + (index / titleWords.length) * 0.72;
                const end = Math.min(1, start + 0.2);
                return (
                  <ScrollTitleWord
                    key={`${word}-${index}`}
                    word={word}
                    progress={smoothTitleProgress}
                    range={[start, end]}
                    reducedMotion={prefersReduced}
                  />
                );
              })}
            </h2>
          </div>
        </div>

        {/* Unified Asymmetric Bento Grid with 3D Card-Stack Scroll Choreography */}
        <div
          ref={gridRef}
          style={{ perspective: 1200 }}
          className="benefits-bento-grid relative mt-12 lg:mt-14"
        >
          {benefits.map((item) => (
            <BentoCard
              key={item.id}
              item={item}
              progress={smoothGridProgress}
              reducedMotion={prefersReduced}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
