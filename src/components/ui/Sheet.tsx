"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type Side = "left" | "right" | "bottom";

export function Sheet({
  open,
  onClose,
  side = "right",
  title,
  children,
  widthClassName,
}: {
  open: boolean;
  onClose: () => void;
  side?: Side;
  title?: string;
  children: ReactNode;
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
      ? "left-0 top-0 h-full animate-[slide-up_0.01s] "
      : side === "right"
      ? "right-0 top-0 h-full"
      : "left-0 right-0 bottom-0 rounded-t-2xl max-h-[85vh]";

  const panelWidth =
    side === "bottom" ? "w-full" : widthClassName ?? "w-full max-w-md";

  return createPortal(
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label={title}>
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-fade-in"
        onClick={onClose}
      />
      <div
        className={cn(
          "absolute flex flex-col bg-surface shadow-lift dark:bg-surface-dark",
          panelPosition,
          panelWidth,
          side === "bottom" ? "animate-slide-up" : "animate-fade-in"
        )}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4 dark:border-line-dark">
          <h2 className="text-base font-semibold">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Закрыть"
            className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-black/[0.05] dark:hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain">{children}</div>
      </div>
    </div>,
    document.body
  );
}
