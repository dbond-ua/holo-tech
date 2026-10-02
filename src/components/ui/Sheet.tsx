"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type Side = "left" | "right" | "bottom";

/**
 * Modal side panel / bottom sheet. Square-edged panels with a hairline
 * header; slides in from its edge (240ms), backdrop fades.
 */
export function Sheet({
  open,
  onClose,
  side = "right",
  title,
  children,
  footer,
  widthClassName,
}: {
  open: boolean;
  onClose: () => void;
  side?: Side;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  widthClassName?: string;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  const panelPosition =
    side === "left"
      ? "left-0 top-0 h-full anim-drawer-left"
      : side === "right"
      ? "right-0 top-0 h-full anim-drawer-right"
      : "inset-x-0 bottom-0 max-h-[88dvh] rounded-t-md anim-sheet-up";

  const panelWidth = side === "bottom" ? "w-full" : widthClassName ?? "w-full max-w-md";

  return createPortal(
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label={title}>
      <div className="anim-fade absolute inset-0 bg-[rgb(12_12_11/0.45)]" onClick={onClose} />
      <div className={cn("absolute flex flex-col bg-paper text-fg shadow-overlay", panelPosition, panelWidth)}>
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-rule pl-5 pr-2">
          <h2 className="text-[15px] font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрити"
            className="flex h-10 w-10 items-center justify-center rounded-md text-fg-2 transition-colors hover:text-fg"
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain">{children}</div>
        {footer && (
          <div className="shrink-0 border-t border-rule bg-paper p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
