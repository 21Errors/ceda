import Image from "next/image";
import { Suspense } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  ExternalLink,
  Megaphone,
} from "lucide-react";
import { getPublishedNewsAnnouncements } from "@/lib/portal-content";
import { getAllContentBlocks } from "@/lib/server/portal-content";

const stories = [
  {
    category: "Agency update",
    date: "1 April 2026",
    title: "CEDA announces new Board of Directors",
    summary:
      "The new Board brings experience in enterprise development, innovation and strategic leadership to guide the Agency’s work.",
    image:
      "https://www.ceda.co.bw/sites/default/files/styles/630x490/public/CEDA%20Board%20Memebers_232.jpg?itok=85_4I0Zd",
    alt: "Members of CEDA’s Board of Directors",
    href: "https://www.ceda.co.bw/ceda-announces-new-board-directors",
  },
  {
    category: "Agribusiness",
    date: "19 May 2026",
    title: "A revamped Poultry Financial Suite",
    summary:
      "CEDA launched a financing suite designed to support citizen enterprises across Botswana’s poultry value chain.",
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
      "CEDA’s 14th branch extends access to business support and services for local entrepreneurs.",
    image:
      "https://www.ceda.co.bw/sites/default/files/styles/390x240/public/597671624_1279079664246474_8849870724456199716_n.jpg?itok=GLG5VKUQ",
    alt: "CEDA Tutume branch opening",
    href: "https://www.ceda.co.bw/node/77604",
  },
  {
    category: "Enterprise development",
    date: "10 August 2026",
    title: "CEDA embraces value chain funding",
    summary:
      "The agency is shifting towards supporting connected industries and the businesses that make up their value chains.",
    image:
      "https://www.ceda.co.bw/sites/default/files/styles/390x240/public/CEDA%20Board%20Memebers_232.jpg?itok=yJbUednJ",
    alt: "CEDA leadership and enterprise development",
    href: "https://dailynews.gov.bw/news-detail/92627",
  },
];

async function PortalAnnouncementsSection() {
  const blocks = await getAllContentBlocks();
  const announcements = getPublishedNewsAnnouncements(blocks);
  if (!announcements.length) return null;

  return (
    <section
      className="px-4 pb-6 sm:px-6 lg:px-8"
      aria-labelledby="portal-announcements-title">
      <div className="mx-auto max-w-[1380px] rounded-2xl border border-ceda-line bg-[#FFF9F4] p-6 sm:p-8">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ceda-burgundy text-white">
            <Megaphone aria-hidden="true" className="h-4 w-4" />
          </span>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-ceda-burgundy">
              Portal notices
            </p>
            <h2
              id="portal-announcements-title"
              className="text-xl font-bold text-ceda-ink">
              Innovation Portal announcements
            </h2>
          </div>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {announcements.map((item) => (
            <article
              key={item.key}
              className="rounded-xl border border-ceda-line bg-white p-5 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-base font-bold text-ceda-ink">
                  {item.title}
                </h3>
                {item.updatedAt && (
                  <time
                    dateTime={item.updatedAt.toISOString()}
                    className="text-xs text-ceda-muted">
                    {item.updatedAt.toLocaleDateString("en-BW", {
                      dateStyle: "medium",
                      timeZone: "Africa/Gaborone",
                    })}
                  </time>
                )}
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-ceda-body">
                {item.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function NewsPage() {
  const [featured, ...rest] = stories;
  return (
    <main id="main-content" className="flex-1 bg-white">
      <section className="px-4 pb-10 pt-10 sm:px-6 sm:pt-14 lg:px-8">
        <div className="mx-auto grid max-w-[1380px] overflow-hidden rounded-2xl bg-[#5C150D] text-white shadow-[0_20px_50px_rgba(122,31,20,0.14)] lg:min-h-[370px] lg:grid-cols-[1fr_0.9fr]">
          <div className="relative flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-14 lg:py-14">
            <div
              aria-hidden="true"
              className="absolute inset-0 opacity-[0.12]"
              style={{
                backgroundImage: "radial-gradient(#fff 1px, transparent 1px)",
                backgroundSize: "22px 22px",
              }}
            />
            <div className="relative">
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#F4B58A]">
                CEDA in motion
              </p>
              <h1 className="mt-4 max-w-xl text-4xl font-black leading-tight sm:text-5xl">
                News, ideas and enterprise stories
              </h1>
              <p className="mt-4 max-w-xl leading-7 text-white/75">
                Follow the programmes, partnerships and people shaping citizen
                enterprise in Botswana.
              </p>
              <a
                href="https://www.ceda.co.bw/news-and-events"
                target="_blank"
                rel="noreferrer"
                className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-bold text-ceda-burgundy transition hover:bg-[#FFF1E4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                Visit CEDA News{" "}
                <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </div>
          </div>
          <div className="relative min-h-[230px] bg-[#F8F9FA] lg:min-h-full">
            <Image
              src={featured.image}
              alt={featured.alt}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#331F17]/65 via-transparent to-transparent" />
            <p className="absolute bottom-5 left-5 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-ceda-ink">
              <CalendarDays
                aria-hidden="true"
                className="h-4 w-4 text-ceda-burgundy"
              />{" "}
              Featured agency update
            </p>
          </div>
        </div>
      </section>

      <Suspense fallback={null}>
        <PortalAnnouncementsSection />
      </Suspense>

      <section
        className="px-4 py-10 sm:px-6 lg:px-8 lg:py-14"
        aria-labelledby="latest-news-title">
        <div className="mx-auto max-w-[1380px]">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-ceda-orange">
                From CEDA
              </p>
              <h2
                id="latest-news-title"
                className="mt-2 text-3xl font-bold text-ceda-ink">
                Latest updates
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-ceda-muted">
              Stories and announcements are linked to their original CEDA or
              Botswana Daily News source.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {rest.map((story) => (
              <article
                key={story.title}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(51,31,23,0.06)] transition-shadow hover:shadow-[0_16px_40px_rgba(51,31,23,0.12)]">
                <a
                  href={story.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`${story.title} (opens in a new tab)`}
                  className="relative block aspect-[16/10] overflow-hidden bg-[#F8F9FA] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-burgundy">
                  <Image
                    src={story.image}
                    alt={story.alt}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 430px"
                    className="object-cover transition-transform duration-300 hover:scale-[1.03]"
                  />
                </a>
                <div className="p-6">
                  <p className="text-xs font-bold text-ceda-burgundy">
                    {story.category}
                    <span className="px-2 font-normal text-slate-400">·</span>
                    <time className="font-normal text-slate-500">
                      {story.date}
                    </time>
                  </p>
                  <h3 className="mt-3 text-xl font-bold leading-snug text-ceda-ink">
                    <a
                      href={story.href}
                      target="_blank"
                      rel="noreferrer"
                      className="decoration-ceda-burgundy/40 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ceda-burgundy">
                      {story.title}
                    </a>
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-ceda-muted">
                    {story.summary}
                  </p>
                  <a
                    href={story.href}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-5 inline-flex min-h-10 items-center gap-2 text-sm font-bold text-ceda-burgundy hover:text-[#5C150D]">
                    Read story{" "}
                    <ArrowRight aria-hidden="true" className="h-4 w-4" />
                    <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </div>
              </article>
            ))}
          </div>
          <div className="mt-10 rounded-2xl bg-[#F8F9FA] p-6 sm:flex sm:items-center sm:justify-between sm:p-8">
            <div>
              <p className="text-sm font-bold text-ceda-ink">
                Looking for the official archive?
              </p>
              <p className="mt-1 text-sm text-ceda-muted">
                Browse CEDA’s news and events for more announcements and
                programme details.
              </p>
            </div>
            <a
              href="https://www.ceda.co.bw/news-and-events"
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full border border-ceda-line bg-white px-5 text-sm font-semibold text-ceda-burgundy hover:bg-[#FFF9F4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-burgundy sm:mt-0">
              More from CEDA{" "}
              <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
