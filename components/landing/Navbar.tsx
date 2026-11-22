"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutDashboard, Menu } from "lucide-react";
import {
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { authClient } from "@/lib/auth-client";
import {
  getInitials,
  PUBLIC_NAVIGATION,
  type NavItem,
} from "./navbar/nav-items";
import { NavbarAccountMenu } from "./navbar/NavbarAccountMenu";
import { ActiveNavigationLink, NavigationLink } from "./navbar/NavbarLinks";
import { NavbarMobileDrawer } from "./navbar/NavbarMobileDrawer";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function Navbar() {
  const drawerId = "primary-site-drawer";
  const headerRef = useRef<HTMLElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const drawerRef = useRef<HTMLDialogElement>(null);
  const drawerScrollerRef = useRef<HTMLDivElement>(null);
  const drawerSheetRef = useRef<HTMLElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const lastHeaderWidthRef = useRef(0);
  const isWideRef = useRef(false);
  const drawerVisibleRef = useRef(false);

  const { data: session } = authClient.useSession();
  const router = useRouter();

  const links: readonly NavItem[] = session?.user
    ? [
        PUBLIC_NAVIGATION[0],
        { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        ...PUBLIC_NAVIGATION.slice(1),
      ]
    : PUBLIC_NAVIGATION;

  const openMobileDrawer = useCallback(async () => {
    const drawer = drawerRef.current;
    const scroller = drawerScrollerRef.current;
    if (!drawer || !scroller || drawer.open) return;

    drawerVisibleRef.current = false;
    drawer.showModal();

    if (scroller.scrollLeft !== 0) {
      scroller.scrollTo({ left: 0, behavior: "instant" });
      await new Promise<void>((resolve) => {
        window.requestAnimationFrame(() =>
          window.requestAnimationFrame(() => resolve()),
        );
      });
    }

    scroller.scrollTo({ left: scroller.scrollWidth, behavior: "auto" });
  }, []);

  const closeMobileDrawer = useCallback(() => {
    const drawer = drawerRef.current;
    const scroller = drawerScrollerRef.current;
    if (!drawer || !scroller || !drawer.open) return;
    scroller.scrollTo({ left: 0, behavior: "auto" });
  }, []);

  const syncResponsiveLayout = useCallback((force = false) => {
    const header = headerRef.current;
    const inner = innerRef.current;
    const drawer = drawerRef.current;
    if (!header || !inner) return;

    const currentWidth = header.clientWidth;
    const previouslyWide = isWideRef.current;

    if (
      !force &&
      !previouslyWide &&
      currentWidth <= lastHeaderWidthRef.current
    ) {
      return;
    }
    lastHeaderWidthRef.current = currentWidth;

    header.classList.add("is-measuring");
    header.classList.add("is-wide");

    const fitsInline = inner.scrollWidth <= inner.clientWidth + 1;
    isWideRef.current = fitsInline;

    if (fitsInline) {
      if (drawer?.open) {
        drawer.close();
        setMenuOpen(false);
      }
    } else {
      header.classList.remove("is-wide");
    }

    const rafId = window.requestAnimationFrame(() => {
      header.classList.remove("is-measuring");
    });

    return () => window.cancelAnimationFrame(rafId);
  }, []);

  useIsomorphicLayoutEffect(() => {
    const header = headerRef.current;
    const menu = menuRef.current;
    if (!header || !menu) return;

    const cleanupInitial = syncResponsiveLayout(true);
    const observer = new ResizeObserver(() => {
      syncResponsiveLayout(false);
    });
    observer.observe(header);
    observer.observe(menu);

    return () => {
      cleanupInitial?.();
      observer.disconnect();
    };
  }, [syncResponsiveLayout]);

  useIsomorphicLayoutEffect(() => {
    const cleanup = syncResponsiveLayout(true);
    return () => cleanup?.();
  }, [session?.user, links.length, syncResponsiveLayout]);

  useEffect(() => {
    const drawer = drawerRef.current;
    const scroller = drawerScrollerRef.current;
    const sheet = drawerSheetRef.current;
    if (!drawer || !scroller || !sheet) return;

    const visibleThreshold = 1 / Math.max(window.innerWidth, 320);

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries.at(-1);
        if (!entry) return;
        if (entry.intersectionRatio >= visibleThreshold) {
          drawerVisibleRef.current = true;
          if (entry.intersectionRatio === 1) {
            setMenuOpen(true);
          }
        } else if (drawerVisibleRef.current) {
          drawerVisibleRef.current = false;
          if (drawer.open) {
            drawer.close();
          }
          setMenuOpen(false);
        }
      },
      { root: drawer, threshold: [visibleThreshold, 1] },
    );
    observer.observe(sheet);

    const handleCancel = (event: Event) => {
      if (event.cancelable) {
        event.preventDefault();
        closeMobileDrawer();
      }
    };

    const handleClose = () => {
      drawerVisibleRef.current = false;
      setMenuOpen(false);
    };

    const handleClick = (event: MouseEvent) => {
      if (event.target instanceof Node && !sheet.contains(event.target)) {
        closeMobileDrawer();
      }
    };

    drawer.addEventListener("cancel", handleCancel);
    drawer.addEventListener("close", handleClose);
    drawer.addEventListener("click", handleClick);

    let removeScrollFallback: (() => void) | undefined;
    if (
      typeof CSS === "undefined" ||
      !CSS.supports("animation-timeline", "scroll()")
    ) {
      const handleScroll = () => {
        const sheetWidth = Math.max(1, sheet.offsetWidth);
        const ratio = Math.max(0, Math.min(1, scroller.scrollLeft / sheetWidth));
        drawer.style.setProperty("--drawer-backdrop", String(ratio));
      };
      scroller.addEventListener("scroll", handleScroll, { passive: true });
      removeScrollFallback = () =>
        scroller.removeEventListener("scroll", handleScroll);
    }

    return () => {
      observer.disconnect();
      drawer.removeEventListener("cancel", handleCancel);
      drawer.removeEventListener("close", handleClose);
      drawer.removeEventListener("click", handleClick);
      removeScrollFallback?.();
    };
  }, [closeMobileDrawer]);

  useEffect(() => {
    const header = headerRef.current;
    const sentinel = sentinelRef.current;
    if (!header || !sentinel) return;
    if (
      typeof CSS !== "undefined" &&
      CSS.supports("container-type", "scroll-state")
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        header.classList.toggle("is-stuck", !entry.isIntersecting);
      },
      { threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  async function handleSignOut() {
    closeMobileDrawer();
    await authClient.signOut();
    router.refresh();
  }

  const initials = getInitials(session?.user?.name, session?.user?.email);

  return (
    <>
      <div
        ref={sentinelRef}
        aria-hidden="true"
        className="pointer-events-none -mb-px h-px w-full"
      />
      <header ref={headerRef} className="site-header">
        <div className="site-header-bar">
          <div ref={innerRef} className="site-header-inner">
            <Link
              href="/"
              aria-label="CEDA Innovation Portal home"
              onClick={closeMobileDrawer}
              className="group inline-flex items-center gap-3 rounded-lg py-1 focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ceda-orange"
            >
              <span className="relative block h-11 w-28 sm:w-32">
                <Image
                  src="/assets/ceda logo.png"
                  alt="CEDA — Citizen Entrepreneurial Development Agency"
                  fill
                  sizes="(max-width: 640px) 112px, 128px"
                  className="object-contain object-left"
                  priority
                />
              </span>
            </Link>

            <nav aria-label="Primary" className="flex items-center">
              <button
                type="button"
                className="site-menu-button"
                aria-controls={drawerId}
                aria-expanded={menuOpen}
                onClick={openMobileDrawer}
              >
                <Menu aria-hidden="true" className="h-4 w-4 text-ceda-burgundy" />
                <span>Menu</span>
              </button>

              <ul ref={menuRef} className="site-menu">
                {links.map((item) => (
                  <li key={item.href}>
                    <Suspense
                      fallback={
                        <NavigationLink
                          item={item}
                          onNavigate={closeMobileDrawer}
                        />
                      }
                    >
                      <ActiveNavigationLink
                        item={item}
                        onNavigate={closeMobileDrawer}
                      />
                    </Suspense>
                  </li>
                ))}
              </ul>
            </nav>

            <NavbarAccountMenu
              user={session?.user ?? null}
              initials={initials}
              onSignOut={() => void handleSignOut()}
            />
          </div>
        </div>
      </header>

      <NavbarMobileDrawer
        drawerId={drawerId}
        drawerRef={drawerRef}
        drawerScrollerRef={drawerScrollerRef}
        drawerSheetRef={drawerSheetRef}
        links={links}
        user={session?.user ?? null}
        initials={initials}
        onClose={closeMobileDrawer}
        onSignOut={() => void handleSignOut()}
      />
    </>
  );
}
