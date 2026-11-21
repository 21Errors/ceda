import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { FooterArcWatermark } from "@/components/landing/FooterArcWatermark";

const copyrightYear = 2026;

const directoryColumns = [
  {
    title: "Portal",
    links: [
      { label: "Home", href: "/", external: false },
      { label: "Submit an idea", href: "/submit", external: false },
      { label: "Track a submission", href: "/track", external: false },
      { label: "News and updates", href: "/news", external: false },
    ],
  },
  {
    title: "Agency",
    links: [
      { label: "About CEDA", href: "/about", external: false },
      { label: "Application guidelines", href: "/guidelines", external: false },
      { label: "Frequently asked questions", href: "/faq", external: false },
      { label: "Help and support", href: "/support", external: false },
    ],
  },
  {
    title: "Governance",
    links: [
      { label: "Terms of use", href: "/terms", external: false },
      { label: "Privacy information", href: "/privacy", external: false },
      {
        label: "Official CEDA website",
        href: "https://www.ceda.co.bw",
        external: true,
      },
    ],
  },
] as const;

export function Footer() {
  return (
    <footer className="relative isolate overflow-hidden bg-[#4A120B] text-[#EBD9CE]">
      {/* Four-tone horizon seam echoing the CEDA rising-arc emblem */}
      <div
        aria-hidden="true"
        className="grid h-1.5 w-full grid-cols-[1.6fr_1.2fr_1fr_0.75fr]"
      >
        <span className="bg-[#7A1F14]" />
        <span className="bg-[#C44517]" />
        <span className="bg-[#E8710A]" />
        <span className="bg-[#E5A910]" />
      </div>

      {/* Restrained architectural arc watermark drawn on scroll */}
      <FooterArcWatermark />

      <div className="relative mx-auto max-w-[var(--container-shell)] px-gutter">
        {/* Compact institutional identity & navigation directory */}
        <div className="grid grid-cols-1 gap-10 py-10 md:grid-cols-12 lg:gap-8 lg:py-12">
          <div className="space-y-4 md:col-span-5 lg:col-span-4">
            <Link
              href="/"
              aria-label="CEDA Innovation Portal home"
              className="inline-flex rounded-xl bg-white px-3.5 py-2 shadow-sm transition hover:bg-[#FFF9F4] focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[#E8710A]"
            >
              <span className="relative block h-9 w-24">
                <Image
                  src="/assets/ceda logo.png"
                  alt="CEDA — Citizen Entrepreneurial Development Agency"
                  fill
                  sizes="96px"
                  className="object-contain object-left"
                />
              </span>
            </Link>

            <p className="max-w-xs text-sm leading-6 text-[#E3CCC0]">
              Citizen Entrepreneurial Development Agency funds, grows, and sustains viable citizen-owned enterprises across Botswana.
            </p>

            <address className="not-italic">
              <ul className="space-y-1 text-sm text-[#FDF8F3]/90">
                <li>CEDA Head Office, Gaborone, Botswana</li>
                <li>
                  <a
                    href="tel:+2673170895"
                    className="inline-flex min-h-8 items-center tabular-nums underline decoration-[#F4B58A]/40 underline-offset-4 transition hover:text-white hover:decoration-[#F4B58A] focus-visible:rounded-sm focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#E8710A]"
                  >
                    +267 317 0895
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:feedback@ceda.co.bw"
                    className="inline-flex min-h-8 items-center underline decoration-[#F4B58A]/40 underline-offset-4 transition hover:text-white hover:decoration-[#F4B58A] focus-visible:rounded-sm focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#E8710A]"
                  >
                    feedback@ceda.co.bw
                  </a>
                </li>
              </ul>
            </address>
          </div>

          <nav
            aria-label="Footer"
            className="grid grid-cols-1 gap-8 sm:grid-cols-3 md:col-span-7 lg:col-span-8 lg:pl-8"
          >
            {directoryColumns.map((column) => (
              <div key={column.title}>
                <h2 className="text-sm font-semibold text-[#F4B58A]">
                  {column.title}
                </h2>
                <ul className="mt-3 space-y-1">
                  {column.links.map((item) => (
                    <li key={item.label}>
                      {item.external ? (
                        <a
                          href={item.href}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex min-h-8 items-center gap-1.5 text-sm text-[#FDF8F3]/85 transition hover:text-white hover:underline hover:decoration-[#F4B58A] hover:underline-offset-4 focus-visible:rounded-sm focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#E8710A]"
                        >
                          <span>{item.label}</span>
                          <ArrowUpRight
                            aria-hidden="true"
                            className="h-3.5 w-3.5 text-[#F4B58A]"
                          />
                          <span className="sr-only"> (opens in a new tab)</span>
                        </a>
                      ) : (
                        <Link
                          href={item.href}
                          className="inline-flex min-h-8 items-center text-sm text-[#FDF8F3]/85 transition hover:text-white hover:underline hover:decoration-[#F4B58A] hover:underline-offset-4 focus-visible:rounded-sm focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#E8710A]"
                        >
                          {item.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        {/* Bottom colophon with clearance for floating consultant action */}
        <div className="flex flex-col gap-2 border-t border-white/12 pb-20 pt-5 text-xs text-[#D9BEB0] sm:flex-row sm:items-center sm:justify-between sm:pb-6 sm:pr-56">
          <p className="tabular-nums">
            © {copyrightYear} Citizen Entrepreneurial Development Agency, Botswana.
          </p>
          <p>CEDA Innovation Portal</p>
        </div>
      </div>
    </footer>
  );
}
