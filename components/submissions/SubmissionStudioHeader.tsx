"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Compass, FilePlus2, LayoutDashboard } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/cn";
import { Avatar } from "@/components/ui/Avatar";

const STUDIO_TABS = [
  { href: "/submit", label: "Submit Idea", icon: FilePlus2 },
  { href: "/track", label: "Track Submission", icon: Compass },
] as const;

export function SubmissionStudioHeader() {
  const pathname = usePathname();
  const { data: session } = authClient.useSession();

  return (
    <header className="sticky top-0 z-30 border-b border-ceda-line bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[var(--container-shell)] items-center justify-between gap-ds-3 px-gutter">
        <div className="flex items-center gap-ds-4">
          <Link
            href="/"
            aria-label="CEDA Innovation Portal home"
            className="flex shrink-0 items-center rounded-control focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange"
          >
            <span className="relative block h-9 w-24 sm:w-28">
              <Image
                src="/assets/ceda logo.png"
                alt="CEDA"
                fill
                sizes="112px"
                className="object-contain object-left"
                priority
              />
            </span>
          </Link>

          <span className="hidden h-5 w-px bg-ceda-line sm:block" aria-hidden="true" />

          <nav aria-label="Submission studio" className="flex items-center gap-1">
            {STUDIO_TABS.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex min-h-10 items-center gap-ds-2 rounded-full px-ds-3 text-xs font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange sm:px-ds-4 sm:text-sm",
                    active
                      ? "bg-ceda-cream-mid text-ceda-burgundy ring-1 ring-ceda-burgundy/20"
                      : "text-ceda-body hover:bg-surface-muted hover:text-ceda-ink",
                  )}
                >
                  <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-ds-2">
          {session?.user ? (
            <>
              <Link
                href="/dashboard"
                className="inline-flex min-h-10 items-center gap-ds-2 rounded-full border border-ceda-line bg-white px-ds-4 text-xs font-bold text-ceda-burgundy transition hover:bg-ceda-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange sm:text-sm"
              >
                <LayoutDashboard aria-hidden="true" className="h-4 w-4" />
                <span className="hidden sm:inline">My Dashboard</span>
              </Link>
              <Link
                href="/profile"
                aria-label="Open profile"
                className="hidden rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange md:inline-flex"
              >
                <Avatar name={session.user.name || session.user.email || "User"} size="sm" />
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/"
                className="hidden min-h-10 items-center gap-1.5 rounded-full px-ds-3 text-xs font-semibold text-ceda-muted transition hover:text-ceda-burgundy sm:inline-flex"
              >
                <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
                <span>Portal Home</span>
              </Link>
              <Link
                href="/login"
                className="inline-flex min-h-10 items-center rounded-full bg-ceda-burgundy px-ds-4 text-xs font-bold text-white transition hover:bg-ceda-burgundy-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange sm:text-sm"
              >
                Sign In
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
