import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, CheckCircle2, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";

const AUTH_HIGHLIGHTS = [
  {
    title: "Multi-modal secure access",
    description: "Sign in with verified credentials, hashed 6-digit email OTPs, or passkey biometrics.",
    Icon: LockKeyhole,
  },
  {
    title: "Transparent 5-stage pipeline",
    description: "Follow your innovation from draft submission through evaluation, feedback, and award.",
    Icon: Sparkles,
  },
  {
    title: "Botswana DPA 2024 aligned",
    description: "Purpose-limited collection, immutable audit trails, and encrypted document storage.",
    Icon: ShieldCheck,
  },
] as const;

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen bg-ceda-cream/45 lg:grid-cols-[minmax(360px,0.9fr)_1.1fr]">
      {/* Brand Editorial Panel (Desktop) */}
      <aside
        aria-label="About CEDA Innovation Portal"
        className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-ceda-burgundy-dark via-ceda-burgundy to-[#3E120D] p-ds-10 text-white lg:flex xl:p-ds-12"
      >
        {/* Subtle CEDA geometric texture & warm glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-15"
          style={{
            backgroundImage: "radial-gradient(#F4B58A 1.1px, transparent 1.1px)",
            backgroundSize: "22px 22px",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-ceda-orange/25 blur-3xl"
        />

        <div className="relative z-10">
          <Link
            href="/"
            aria-label="CEDA Innovation Portal home"
            className="inline-flex items-center gap-ds-3 rounded-full bg-white/95 px-ds-4 py-ds-2 shadow-sm transition hover:bg-white focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ceda-peach"
          >
            <span className="relative block h-8 w-24">
              <Image
                src="/assets/ceda logo.png"
                alt="CEDA"
                fill
                sizes="96px"
                className="object-contain object-left"
                priority
              />
            </span>
          </Link>

          <p className="mt-ds-12 text-xs font-extrabold uppercase tracking-[0.2em] text-ceda-peach">
            CEDA Innovation Portal
          </p>
          <h2 className="mt-ds-3 max-w-md text-3xl font-black leading-tight tracking-tight text-white xl:text-4xl">
            Citizen innovation, governed with clarity.
          </h2>
          <p className="mt-ds-4 max-w-md text-sm leading-7 text-white/80">
            Access your role workspace to submit breakthrough proposals, score applications, coordinate adjudication, or support citizen entrepreneurs across Botswana.
          </p>

          <ul className="mt-ds-8 space-y-ds-5">
            {AUTH_HIGHLIGHTS.map(({ title, description, Icon }) => (
              <li key={title} className="flex items-start gap-ds-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/12 text-ceda-peach ring-1 ring-white/15">
                  <Icon aria-hidden="true" className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-bold text-white">{title}</p>
                  <p className="mt-0.5 text-xs leading-5 text-white/75">{description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 mt-ds-10 flex flex-wrap items-center justify-between gap-ds-3 border-t border-white/15 pt-ds-5 text-xs text-white/70">
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5 text-ceda-peach" />
            Citizen Entrepreneurial Development Agency
          </span>
          <div className="flex items-center gap-ds-4">
            <Link href="/support" className="underline decoration-white/30 underline-offset-4 hover:text-white">
              Support
            </Link>
            <Link href="/privacy" className="underline decoration-white/30 underline-offset-4 hover:text-white">
              Privacy
            </Link>
          </div>
        </div>
      </aside>

      {/* Focused Auth Canvas */}
      <div className="flex min-h-screen flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between gap-ds-4 border-b border-ceda-line bg-white/85 px-gutter backdrop-blur-sm lg:border-b-0 lg:bg-transparent">
          <Link
            href="/"
            aria-label="CEDA Innovation Portal home"
            className="flex items-center rounded-control focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange lg:hidden"
          >
            <span className="relative block h-9 w-24">
              <Image
                src="/assets/ceda logo.png"
                alt="CEDA"
                fill
                sizes="96px"
                className="object-contain object-left"
                priority
              />
            </span>
          </Link>

          <Link
            href="/"
            className="ms-auto inline-flex min-h-10 items-center gap-ds-2 rounded-full border border-ceda-line bg-white px-ds-4 text-xs font-bold text-ceda-burgundy shadow-xs transition hover:bg-ceda-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange"
          >
            <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
            <span>Back to portal</span>
          </Link>
        </header>

        <div className="flex flex-1 flex-col justify-center">{children}</div>

        <footer className="flex flex-wrap items-center justify-between gap-ds-3 px-gutter py-ds-4 text-xs text-ceda-muted lg:hidden">
          <span>© 2026 CEDA Innovation Portal</span>
          <div className="flex items-center gap-ds-4">
            <Link href="/support" className="hover:text-ceda-burgundy">
              Support
            </Link>
            <Link href="/privacy" className="hover:text-ceda-burgundy">
              Privacy
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
