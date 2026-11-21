"use client";

import type { CSSProperties, ReactNode } from "react";
import { useCallback, useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

let cachedDisplayTransitionSupport: boolean | undefined;

function canTransitionDisplay(): boolean {
  if (cachedDisplayTransitionSupport !== undefined) return cachedDisplayTransitionSupport;
  if (
    typeof window === "undefined" ||
    !window.CSS?.supports?.("transition-behavior", "allow-discrete") ||
    !document.body
  ) {
    return false;
  }
  const probe = document.createElement("div");
  probe.style.cssText = "transition: display 1s allow-discrete !important; display: block;";
  document.body.appendChild(probe);
  void getComputedStyle(probe).display;
  probe.style.display = "none";
  cachedDisplayTransitionSupport = getComputedStyle(probe).display === "block";
  probe.remove();
  return cachedDisplayTransitionSupport;
}

function supportsTopLayerExit(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(window.CSS?.supports?.("overlay", "auto") && canTransitionDisplay());
}

async function closeDialogWithAnimation(dialog: HTMLDialogElement, returnValue?: string) {
  if (!dialog.open) return;

  if (!supportsTopLayerExit()) {
    dialog.setAttribute("data-closing", "");
    const animations = dialog.getAnimations({ subtree: true });
    if (animations.length > 0) {
      await Promise.race([
        Promise.allSettled(animations.map((animation) => animation.finished)),
        new Promise((resolve) => setTimeout(resolve, 400)),
      ]);
    }
    if (!dialog.hasAttribute("data-closing")) return;
    dialog.removeAttribute("data-closing");
  }

  if (dialog.open) {
    dialog.close(returnValue);
  }
}

export type DialogSize = "sm" | "md" | "lg";
export type DialogClosedBy = "any" | "closerequest" | "none";

const dialogMaxWidths: Record<DialogSize, string> = {
  sm: "26rem",
  md: "34rem",
  lg: "46rem",
};

export interface DialogProps {
  open: boolean;
  onClose: (returnValue: string) => void;
  title: string;
  description?: string;
  size?: DialogSize;
  closedBy?: DialogClosedBy;
  onCancelBlocked?: () => void;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Native `<dialog>` modal following modern top-layer best practices:
 * - Opened via `showModal()` (browser handles inert background, focus trap, Esc, focus return)
 * - No redundant `role="dialog"` or `aria-modal`
 * - Uses `closedby` with pointer-coordinate fallback where unsupported
 * - Animates top-layer entry/exit via `@starting-style` + `data-closing` exit fallback
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  size = "md",
  closedBy = "any",
  onCancelBlocked,
  footer,
  children,
  className,
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  const requestClose = useCallback(
    (returnValue = "") => {
      const dialog = dialogRef.current;
      if (!dialog) return;
      void closeDialogWithAnimation(dialog, returnValue);
    },
    [],
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.removeAttribute("data-closing");
      dialog.showModal();
    } else if (!open && dialog.open) {
      void closeDialogWithAnimation(dialog);
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      const result = dialog.returnValue;
      dialog.returnValue = "";
      onClose(result);
    };

    const handleCancel = (event: Event) => {
      event.preventDefault();
      if (closedBy === "none") {
        onCancelBlocked?.();
        return;
      }
      void closeDialogWithAnimation(dialog);
    };

    dialog.addEventListener("close", handleClose);
    dialog.addEventListener("cancel", handleCancel);

    let cleanupBackdrop: (() => void) | undefined;
    if (closedBy === "any" && typeof HTMLDialogElement !== "undefined" && !("closedBy" in HTMLDialogElement.prototype)) {
      let pressedOutside = false;
      const isOutside = (event: PointerEvent) => {
        const rect = dialog.getBoundingClientRect();
        return (
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom
        );
      };

      const onPointerDown = (event: PointerEvent) => {
        pressedOutside = isOutside(event);
      };
      const onPointerUp = (event: PointerEvent) => {
        if (pressedOutside && isOutside(event)) {
          void closeDialogWithAnimation(dialog);
        }
        pressedOutside = false;
      };

      dialog.addEventListener("pointerdown", onPointerDown);
      dialog.addEventListener("pointerup", onPointerUp);
      cleanupBackdrop = () => {
        dialog.removeEventListener("pointerdown", onPointerDown);
        dialog.removeEventListener("pointerup", onPointerUp);
      };
    }

    return () => {
      dialog.removeEventListener("close", handleClose);
      dialog.removeEventListener("cancel", handleCancel);
      cleanupBackdrop?.();
    };
  }, [closedBy, onCancelBlocked, onClose]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      style={{ "--dialog-max-width": dialogMaxWidths[size] } as CSSProperties}
      className={cn("ds-dialog", className)}
      {...({ closedby: closedBy } as Record<string, string>)}
    >
      <div className="flex items-start justify-between gap-ds-4 border-b border-ceda-line bg-ceda-cream px-card py-ds-5">
        <div className="min-w-0">
          <h2 id={titleId} className="text-lg font-bold leading-snug text-ceda-ink sm:text-xl">
            {title}
          </h2>
          {description ? (
            <p id={descriptionId} className="mt-1 text-sm leading-6 text-ceda-muted">
              {description}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => {
            if (closedBy === "none" && onCancelBlocked) {
              onCancelBlocked();
              return;
            }
            requestClose("dismiss");
          }}
          aria-label="Close dialog"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ceda-body transition hover:bg-ceda-cream-mid hover:text-ceda-burgundy focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange"
        >
          <X aria-hidden="true" className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-card py-ds-6">{children}</div>

      {footer ? (
        <div className="flex flex-wrap items-center justify-end gap-cluster border-t border-ceda-line bg-ceda-cream/55 px-card py-ds-4">
          {footer}
        </div>
      ) : null}
    </dialog>
  );
}
