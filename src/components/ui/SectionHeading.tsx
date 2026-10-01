import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Section header. The eyebrow is a mono index line ("01 — Каталог") rather
 * than a tracked-out uppercase label, and the title sits on a hairline that
 * spans the container — the page reads as numbered sheets of one document.
 */
export function SectionHeading({
  eyebrow,
  index,
  title,
  description,
  action,
  className,
  as: As = "h2",
  rule = true,
}: {
  eyebrow?: string;
  index?: string;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3";
  rule?: boolean;
}) {
  return (
    <div className={cn(rule && "border-t border-fg pt-4 sm:pt-5", className)}>
      {(eyebrow || index) && (
        <p className="caption mb-5 flex items-center gap-3 text-fg-2 sm:mb-8">
          {index && <span className="text-fg">{index}</span>}
          {eyebrow && <span>{eyebrow}</span>}
        </p>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-10">
        <div className="max-w-3xl">
          <As className="text-balance text-[26px] font-semibold leading-[1.1] tracking-[-0.02em] sm:text-h2">
            {title}
          </As>
          {description && <p className="mt-3 max-w-xl text-base text-fg-2">{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}
