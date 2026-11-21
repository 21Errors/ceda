"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import { ArrowRight, CalendarDays, Users } from "lucide-react";

export function ShowcaseSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReduced = useReducedMotion() ?? false;

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const posterRotateY = useTransform(scrollYProgress, [0, 0.5, 1], [-8, 0, 6]);
  const posterRotateX = useTransform(scrollYProgress, [0, 0.5, 1], [6, 0, -4]);
  const posterY = useTransform(scrollYProgress, [0, 1], [28, -28]);

  return (
    <section
      id="active-call"
      ref={sectionRef}
      className="relative overflow-hidden border-t border-[#7A1F14]/10 bg-[#FFF7F0] px-4 py-24 sm:px-6 lg:px-8 lg:py-32"
    >
      <div className="mx-auto max-w-345">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
          {/* 3D Scroll-Driven Poster Frame */}
          <div
            style={{ perspective: 1200 }}
            className="lg:col-span-6"
          >
            <motion.div
              style={
                prefersReduced
                  ? undefined
                  : {
                      rotateY: posterRotateY,
                      rotateX: posterRotateX,
                      y: posterY,
                      transformStyle: "preserve-3d",
                    }
              }
              className="relative aspect-4/3 w-full overflow-hidden rounded-2xl bg-white shadow-[0_20px_50px_rgba(51,31,23,0.08)]"
            >
              <Image
                src="/assets/poster.jpg"
                alt="CEDA Innovation Portal Hackathon competition poster"
                fill
                sizes="(max-width: 1024px) 100vw, 48vw"
                className="object-contain p-4"
              />
              <span className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-[#E8F5ED] px-3.5 py-1.5 text-xs font-bold text-[#14532D] shadow-sm">
                Open
              </span>
            </motion.div>
          </div>

          {/* Right Editorial Details */}
          <div className="lg:col-span-6">
            <p className="text-sm font-semibold text-[#E8710A]">
              Open competition
            </p>
            <h2 className="mt-3 text-[clamp(1.9rem,3.6vw,3rem)] font-black leading-[1.08] tracking-[-0.03em] text-[#331F17]">
              CEDA Innovation Portal Hackathon
            </h2>
            <p className="mt-5 max-w-xl text-sm leading-7 text-[#573E32] sm:text-base">
              Build a user-friendly platform that takes citizen ideas in
              Botswana from submission through review, feedback, and awards.
              Open to youth-owned citizen companies where young Batswana own
              more than 50% of the business.
            </p>

            <dl className="mt-8 grid grid-cols-1 gap-4 border-y border-[#7A1F14]/15 py-6 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <CalendarDays
                  aria-hidden="true"
                  className="mt-0.5 h-5 w-5 shrink-0 text-[#7A1F14]"
                />
                <div>
                  <dt className="text-xs font-medium text-[#7F5E4E]">
                    Dates
                  </dt>
                  <dd className="mt-0.5 text-sm font-bold text-[#331F17]">
                    13–23 November 2026
                  </dd>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Users
                  aria-hidden="true"
                  className="mt-0.5 h-5 w-5 shrink-0 text-[#7A1F14]"
                />
                <div>
                  <dt className="text-xs font-medium text-[#7F5E4E]">
                    Who can enter
                  </dt>
                  <dd className="mt-0.5 text-sm font-bold text-[#331F17]">
                    Online, teams of 1–5 people
                  </dd>
                </div>
              </div>
            </dl>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/submit"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#7A1F14] px-7 text-sm font-bold text-white shadow-lg shadow-[#7A1F14]/20 transition hover:bg-[#5C150D] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#E8710A]"
              >
                <span>Enter this competition</span>
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
              <Link
                href="/guidelines"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#7A1F14]/25 bg-white px-6 text-sm font-semibold text-[#7A1F14] transition hover:border-[#7A1F14] hover:bg-[#FFF7F0] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#E8710A]"
              >
                Read competition rules
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
