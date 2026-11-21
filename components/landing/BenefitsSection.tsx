"use client";

import { useRef, type ReactNode } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import {
  Banknote,
  Compass,
  FileCheck2,
  MessageSquareText,
} from "lucide-react";

interface TiltPanelProps {
  children: ReactNode;
  className?: string;
  reducedMotion: boolean;
}

function TiltPanel({ children, className = "", reducedMotion }: TiltPanelProps) {
  const ref = useRef<HTMLDivElement>(null);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);

  const rotateX = useSpring(rawX, { stiffness: 220, damping: 24, mass: 0.6 });
  const rotateY = useSpring(rawY, { stiffness: 220, damping: 24, mass: 0.6 });

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (reducedMotion || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    rawX.set((0.5 - py) * 9);
    rawY.set((px - 0.5) * 9);
  };

  const handlePointerLeave = () => {
    rawX.set(0);
    rawY.set(0);
  };

  return (
    <div style={{ perspective: 1100 }} className="h-full">
      <motion.div
        ref={ref}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        style={
          reducedMotion
            ? undefined
            : {
                rotateX,
                rotateY,
                transformStyle: "preserve-3d",
              }
        }
        className={`relative h-full overflow-hidden rounded-2xl transition-shadow duration-300 ${className}`}
      >
        <div
          className="relative z-10 h-full"
          style={reducedMotion ? undefined : { transform: "translateZ(20px)" }}
        >
          {children}
        </div>
      </motion.div>
    </div>
  );
}

const benefits = [
  {
    icon: Banknote,
    title: "Access to business funding",
    description:
      "Approved ideas can qualify for CEDA loans, innovation grants, and business support to help you launch and grow across Botswana.",
    detail: "Backed by CEDA across Botswana.",
    featured: true,
  },
  {
    icon: FileCheck2,
    title: "Fair review by experienced reviewers",
    description:
      "Experienced reviewers score your idea using clear standards: whether it can work, whether customers need it, and how it helps Botswana.",
    detail: "Clear scoring rules, never guesswork.",
    featured: false,
  },
  {
    icon: Compass,
    title: "Helpful feedback and a chance to improve",
    description:
      "If reviewers see something missing, your application is not simply rejected. You get clear notes and can submit an improved version right in the portal.",
    detail: "Improve your idea without starting over.",
    featured: false,
  },
  {
    icon: MessageSquareText,
    title: "Direct help from CEDA advisors",
    description:
      "Chat with a CEDA advisor during working hours (09:00–16:00 CAT) if you have questions about who can apply, what documents you need, or how to prepare.",
    detail: "Real people in Gaborone ready to help.",
    featured: false,
  },
];

export function BenefitsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReduced = useReducedMotion() ?? false;

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const leftColumnY = useTransform(scrollYProgress, [0, 1], [32, -28]);
  const rightColumnY = useTransform(scrollYProgress, [0, 1], [56, -10]);

  const [leadBenefit, ...secondaryBenefits] = benefits;
  const LeadIcon = leadBenefit.icon;

  return (
    <section
      id="benefits"
      ref={sectionRef}
      className="relative overflow-hidden bg-[#FFF7F0] px-4 py-24 sm:px-6 lg:px-8 lg:py-32"
    >
      <div className="mx-auto max-w-345">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p className="text-sm font-semibold text-[#E8710A]">
              What you get when you apply
            </p>
            <h2 className="mt-3 text-[clamp(2rem,4vw,3.25rem)] font-black leading-[1.06] tracking-[-0.03em] text-[#331F17]">
              More than an application form. Real support to help your business grow.
            </h2>
          </div>
          <p className="max-w-md text-sm leading-7 text-[#573E32] sm:text-base lg:col-span-5 lg:justify-self-end">
            Every idea goes through a clear process designed to strengthen your
            plan and connect strong businesses with funding and advice.
          </p>
        </div>

        {/* 3D differential column parallax + staggered scroll reveals */}
        <div
          style={{ perspective: 1400 }}
          className="mt-14 grid grid-cols-1 gap-6 lg:mt-16 lg:grid-cols-12"
        >
          {/* Asymmetric Lead Feature Panel */}
          <motion.div
            style={prefersReduced ? undefined : { y: leftColumnY }}
            className="lg:col-span-5"
          >
            <motion.div
              initial={
                prefersReduced
                  ? false
                  : { opacity: 0, y: 28, rotateX: 8 }
              }
              whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="h-full"
            >
              <TiltPanel
                reducedMotion={prefersReduced}
                className="border border-[#7A1F14]/20 bg-linear-to-br from-[#7A1F14] via-[#5C150D] to-[#3B0E09] p-8 text-white shadow-[0_24px_54px_rgba(122,31,20,0.2)] sm:p-10"
              >
                <div className="flex h-full flex-col justify-between gap-10">
                  <div>
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/12 text-[#F4B58A] ring-1 ring-white/15">
                      <LeadIcon aria-hidden="true" className="h-6 w-6" />
                    </span>
                    <h3 className="mt-7 text-2xl font-bold leading-snug tracking-tight sm:text-3xl">
                      {leadBenefit.title}
                    </h3>
                    <p className="mt-4 text-sm leading-7 text-[#F4DDD0] sm:text-base">
                      {leadBenefit.description}
                    </p>
                  </div>

                  <div className="border-t border-white/15 pt-5">
                    <p className="text-xs font-medium text-[#F4B58A]">
                      {leadBenefit.detail}
                    </p>
                  </div>
                </div>
              </TiltPanel>
            </motion.div>
          </motion.div>

          {/* Right Asymmetric Stack */}
          <motion.div
            style={prefersReduced ? undefined : { y: rightColumnY }}
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:col-span-7"
          >
            {secondaryBenefits.map((item, idx) => {
              const Icon = item.icon;
              const isWide = idx === 2;
              return (
                <motion.div
                  key={item.title}
                  initial={
                    prefersReduced
                      ? false
                      : { opacity: 0, y: 28, rotateX: 8 }
                  }
                  whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{
                    duration: 0.6,
                    delay: 0.08 + idx * 0.08,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className={isWide ? "sm:col-span-2" : ""}
                >
                  <TiltPanel
                    reducedMotion={prefersReduced}
                    className="border border-[#7A1F14]/12 bg-white p-7 shadow-[0_12px_32px_rgba(51,31,23,0.05)] hover:border-[#7A1F14]/25 sm:p-8"
                  >
                    <div className="flex h-full flex-col justify-between gap-6">
                      <div>
                        <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFF0E2] text-[#7A1F14]">
                          <Icon aria-hidden="true" className="h-5 w-5" />
                        </span>
                        <h3 className="mt-5 text-lg font-bold tracking-tight text-[#331F17] sm:text-xl">
                          {item.title}
                        </h3>
                        <p className="mt-2.5 max-w-xl text-sm leading-7 text-[#573E32]">
                          {item.description}
                        </p>
                      </div>

                      <p className="text-xs font-semibold text-[#7A1F14]">
                        {item.detail}
                      </p>
                    </div>
                  </TiltPanel>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
