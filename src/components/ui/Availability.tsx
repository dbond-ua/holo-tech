import type { Availability as AvailabilityValue } from "@/lib/product-ui";
import { cn } from "@/lib/utils";

const dot: Record<AvailabilityValue["kind"], string> = {
  in_stock: "bg-ok",
  low: "bg-warn",
  on_order: "bg-warn",
  out: "bg-fg-3",
};

const text: Record<AvailabilityValue["kind"], string> = {
  in_stock: "text-ok",
  low: "text-warn",
  on_order: "text-warn",
  out: "text-fg-2",
};

export function Availability({
  value,
  className,
  detail,
}: {
  value: AvailabilityValue;
  className?: string;
  detail?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[13px] leading-none", text[value.kind], className)}>
      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dot[value.kind])} aria-hidden="true" />
      {value.label}
      {detail && <span className="text-fg-2">· {detail}</span>}
    </span>
  );
}
