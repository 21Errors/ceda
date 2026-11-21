"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, MessagesSquare, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { AlertModal } from "@/components/landing/AlertModal";
import { LiveChatModal } from "@/components/landing/LiveChatModal";

const ease = [0.22, 1, 0.36, 1] as const;

export function GlobalSupportActions() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const containerRef = useRef<HTMLElement>(null);
  const prefersReduced = useReducedMotion() ?? false;

  useEffect(() => {
    if (!menuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  const openChat = () => {
    setMenuOpen(false);
    setChatModalOpen(true);
  };

  const openAlerts = () => {
    setMenuOpen(false);
    setAlertModalOpen(true);
  };

  return (
    <>
      <aside
        ref={containerRef}
        aria-label="CEDA support options"
        className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-3 z-40 flex max-w-[calc(100vw-1.5rem)] flex-col items-end gap-3 sm:bottom-6 sm:right-6"
      >
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              id="ceda-support-menu"
              role="menu"
              aria-label="Choose a support option"
              initial={
                prefersReduced
                  ? { opacity: 0 }
                  : { opacity: 0, y: 12, scale: 0.94 }
              }
              animate={
                prefersReduced
                  ? { opacity: 1 }
                  : { opacity: 1, y: 0, scale: 1 }
              }
              exit={
                prefersReduced
                  ? { opacity: 0 }
                  : { opacity: 0, y: 10, scale: 0.95 }
              }
              transition={{ duration: 0.24, ease }}
              style={{ transformOrigin: "bottom right" }}
              className="w-72 overflow-hidden rounded-2xl border border-[#7A1F14]/15 bg-white p-2 shadow-[0_20px_50px_rgba(51,31,23,0.16)]"
            >
              <motion.button
                type="button"
                role="menuitem"
                onClick={openChat}
                initial={prefersReduced ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, delay: 0.04, ease }}
                className="group flex w-full items-start gap-3.5 rounded-xl p-3 text-left transition-colors hover:bg-[#FFF7F0] focus-visible:outline-2 focus-visible:outline-[#E8710A]"
              >
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#7A1F14] text-white">
                  <MessagesSquare aria-hidden="true" className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-2 text-sm font-bold text-[#331F17]">
                    Chat with an advisor
                    <span
                      aria-hidden="true"
                      className="h-2 w-2 rounded-full bg-emerald-500"
                    />
                  </span>
                  <span className="mt-0.5 block text-xs leading-5 text-[#573E32]">
                    Ask a CEDA advisor about applying or your documents.
                  </span>
                </span>
              </motion.button>

              <motion.button
                type="button"
                role="menuitem"
                onClick={openAlerts}
                initial={prefersReduced ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, delay: 0.09, ease }}
                className="group mt-1 flex w-full items-start gap-3.5 rounded-xl p-3 text-left transition-colors hover:bg-[#FFF7F0] focus-visible:outline-2 focus-visible:outline-[#E8710A]"
              >
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FFF0E2] text-[#E8710A]">
                  <Bell aria-hidden="true" className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-[#331F17]">
                    Get free status alerts
                  </span>
                  <span className="mt-0.5 block text-xs leading-5 text-[#573E32]">
                    Receive email or SMS updates when your application moves.
                  </span>
                </span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Single Consolidated Trigger Pill */}
        <motion.button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          whileTap={prefersReduced ? undefined : { scale: 0.96 }}
          aria-expanded={menuOpen}
          aria-controls="ceda-support-menu"
          aria-label={menuOpen ? "Close support menu" : "Open CEDA support options"}
          className="flex min-h-11 items-center gap-2.5 rounded-full border border-white/15 bg-[#7A1F14] px-4 py-2.5 text-white shadow-[0_14px_34px_rgba(122,31,20,0.28)] transition-colors hover:bg-[#5C150D] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#E8710A] sm:px-5 sm:py-3"
        >
          <span className="relative flex h-4 w-4 items-center justify-center">
            <AnimatePresence mode="wait" initial={false}>
              {menuOpen ? (
                <motion.span
                  key="close"
                  initial={prefersReduced ? false : { rotate: -90, opacity: 0, scale: 0.7 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={prefersReduced ? undefined : { rotate: 90, opacity: 0, scale: 0.7 }}
                  transition={{ duration: 0.18, ease }}
                  className="flex items-center justify-center"
                >
                  <X aria-hidden="true" className="h-4 w-4" />
                </motion.span>
              ) : (
                <motion.span
                  key="open"
                  initial={prefersReduced ? false : { rotate: 90, opacity: 0, scale: 0.7 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={prefersReduced ? undefined : { rotate: -90, opacity: 0, scale: 0.7 }}
                  transition={{ duration: 0.18, ease }}
                  className="flex items-center justify-center"
                >
                  <MessagesSquare aria-hidden="true" className="h-4 w-4" />
                </motion.span>
              )}
            </AnimatePresence>
          </span>

          <span className="text-xs font-bold tracking-wide">
            {menuOpen ? "Close" : "CEDA Support"}
          </span>
        </motion.button>
      </aside>

      <AlertModal
        isOpen={alertModalOpen}
        onClose={() => setAlertModalOpen(false)}
      />
      <LiveChatModal
        isOpen={chatModalOpen}
        onClose={() => setChatModalOpen(false)}
      />
    </>
  );
}
