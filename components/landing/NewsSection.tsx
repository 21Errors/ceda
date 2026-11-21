"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";

const ease = [0.22, 1, 0.36, 1] as const;

const cedaStories = [
  {
    category: "Agency update",
    date: "1 April 2026",
    title: "CEDA announces new Board of Directors",
    summary:
      "The new board brings strong experience in business growth, innovation, and leadership to guide CEDA’s work across Botswana.",
    image:
      "https://www.ceda.co.bw/sites/default/files/styles/630x490/public/CEDA%20Board%20Memebers_232.jpg?itok=85_4I0Zd",
    alt: "Members of CEDA’s Board of Directors",
    href: "https://www.ceda.co.bw/ceda-announces-new-board-directors",
  },
  {
    category: "Agribusiness",
    date: "19 May 2026",
    title: "CEDA launches updated Poultry Financial Suite",
    summary:
      "New financing options designed to help citizen businesses grow across Botswana’s poultry industry.",
    image:
      "https://www.ceda.co.bw/sites/default/files/styles/390x240/public/703715817_1413775747443531_7357655241376220288_n_0.jpg?itok=TTPNBYj2",
    alt: "CEDA poultry financing suite launch",
    href: "https://www.ceda.co.bw/ceda-officially-launched-revamped-poultry-financial-suite",
  },
  {
    category: "Community",
    date: "8 December 2025",
    title: "Tutume branch officially opens",
    summary:
      "CEDA’s 14th branch brings business advice and funding services closer to entrepreneurs in the Tutume area.",
    image:
      "https://www.ceda.co.bw/sites/default/files/styles/390x240/public/597671624_1279079664246474_8849870724456199716_n.jpg?itok=GLG5VKUQ",
    alt: "CEDA Tutume branch opening",
    href: "https://www.ceda.co.bw/node/77604",
  },
  {
    category: "Business support",
    date: "10 August 2026",
    title: "CEDA expands support for connected industries",
    summary:
      "Funding now links suppliers, producers, and buyers together to build stronger local businesses.",
    image:
      "https://www.ceda.co.bw/sites/default/files/styles/390x240/public/CEDA%20Board%20Memebers_232.jpg?itok=yJbUednJ",
    alt: "CEDA leadership discussing enterprise development",
    href: "https://dailynews.gov.bw/news-detail/92627",
  },
];

export function NewsSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion() ?? false;

  const { scrollYProgress } = useScroll({
    target: stageRef,
    offset: ["start end", "end start"],
  });

  const stageY = useTransform(scrollYProgress, [0, 1], [24, -20]);
  const activeStory = cedaStories[activeIndex];

  return (
    <section
      id="news"
      aria-labelledby="landing-news-heading"
      className="relative border-t border-[#7A1F14]/10 bg-white px-4 py-24 sm:px-6 lg:px-8 lg:py-32"
    >
      <div className="mx-auto max-w-345">
        {/* Section Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#7A1F14]">
              Latest from CEDA
            </p>
            <h2
              id="landing-news-heading"
              className="mt-2.5 text-[clamp(2rem,4vw,3.15rem)] font-black leading-[1.06] tracking-[-0.03em] text-[#331F17]"
            >
              News and updates
            </h2>
          </div>

          <Link
            href="/news"
            className="group inline-flex w-fit items-center gap-1.5 text-sm font-bold text-[#7A1F14] underline decoration-[#7A1F14]/30 underline-offset-4 transition hover:decoration-[#7A1F14] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#E8710A]"
          >
            <span>See all news</span>
            <ArrowRight
              aria-hidden="true"
              className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
            />
          </Link>
        </div>

        {/* Architectural Divider */}
        <motion.div
          aria-hidden="true"
          initial={prefersReduced ? false : { scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease }}
          style={{ transformOrigin: "left" }}
          className="mt-8 h-px w-full bg-[#7A1F14]/15"
        />

        {/* Interactive Split Editorial Stage */}
        <div
          ref={stageRef}
          className="mt-10 grid grid-cols-1 items-start gap-10 lg:mt-14 lg:grid-cols-12 lg:gap-14"
        >
          {/* Left: Selectable Story Index */}
          <div
            role="list"
            aria-label="Recent CEDA news stories"
            className="order-2 divide-y divide-[#7A1F14]/12 border-y border-[#7A1F14]/12 lg:order-1 lg:col-span-5"
          >
            {cedaStories.map((story, index) => {
              const isActive = index === activeIndex;
              return (
                <motion.div
                  key={story.title}
                  role="listitem"
                  initial={prefersReduced ? false : { opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{
                    duration: 0.5,
                    delay: index * 0.08,
                    ease,
                  }}
                  className="relative"
                >
                  {isActive && (
                    <motion.span
                      layoutId="activeNewsIndicator"
                      aria-hidden="true"
                      transition={{
                        type: "spring",
                        stiffness: 340,
                        damping: 32,
                      }}
                      className="absolute bottom-3 left-0 top-3 w-0.75 rounded-full bg-[#7A1F14]"
                    />
                  )}

                  <button
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setActiveIndex(index)}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={`group flex w-full flex-col py-6 pl-5 pr-3 text-left transition-colors focus-visible:outline-3 focus-visible:outline-offset-[-3px] focus-visible:outline-[#E8710A] ${
                      isActive ? "bg-[#FFF9F4]" : "hover:bg-[#FFFBF8]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span
                        className={`text-xs font-bold transition-colors ${
                          isActive ? "text-[#7A1F14]" : "text-[#7F5E4E]"
                        }`}
                      >
                        {story.category}
                      </span>
                      <time className="text-xs text-[#7F5E4E]">
                        {story.date}
                      </time>
                    </div>

                    <span
                      className={`mt-2 text-lg font-bold leading-snug tracking-tight transition-colors sm:text-xl ${
                        isActive
                          ? "text-[#331F17]"
                          : "text-[#573E32] group-hover:text-[#331F17]"
                      }`}
                    >
                      {story.title}
                    </span>
                  </button>
                </motion.div>
              );
            })}
          </div>

          {/* Right: Live Active Story Stage */}
          <motion.div
            style={prefersReduced ? undefined : { y: stageY }}
            className="order-1 lg:order-2 lg:col-span-7"
          >
            <AnimatePresence mode="wait">
              <motion.article
                key={activeStory.title}
                initial={
                  prefersReduced
                    ? false
                    : { opacity: 0, y: 14, scale: 0.985 }
                }
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={
                  prefersReduced
                    ? undefined
                    : { opacity: 0, y: -10, scale: 0.99 }
                }
                transition={{ duration: 0.35, ease }}
                className="overflow-hidden rounded-2xl border border-[#7A1F14]/12 bg-[#FFF9F4]"
              >
                <a
                  href={activeStory.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group relative block h-52 w-full overflow-hidden bg-[#F5ECE5] sm:h-60 lg:h-64"
                >
                  <Image
                    src={activeStory.image}
                    alt={activeStory.alt}
                    fill
                    sizes="(max-width: 1024px) 100vw, 56vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                </a>

                <div className="p-6 sm:p-7">
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    <span className="font-bold text-[#7A1F14]">
                      {activeStory.category}
                    </span>
                    <time className="text-[#7F5E4E]">{activeStory.date}</time>
                  </div>

                  <h3 className="mt-2.5 text-xl font-bold leading-snug tracking-tight text-[#331F17] sm:text-2xl">
                    {activeStory.title}
                  </h3>

                  <p className="mt-2.5 max-w-2xl text-sm leading-7 text-[#573E32]">
                    {activeStory.summary}
                  </p>

                  <a
                    href={activeStory.href}
                    target="_blank"
                    rel="noreferrer"
                    className="group mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-[#7A1F14] underline decoration-[#7A1F14]/35 underline-offset-4 transition hover:decoration-[#7A1F14] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#E8710A]"
                  >
                    <span>Read full story</span>
                    <ArrowUpRight
                      aria-hidden="true"
                      className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    />
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </div>
              </motion.article>
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
