import type { ReactNode } from "react";
import type { OrderStatus } from "@/lib/db/types";
import { cn } from "@/lib/utils";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: "Нове",
  called: "Подзвонили",
  contacted: "Зв'язались",
  postponed: "Відкладено",
  confirmed: "Підтверджено",
  cancelled: "Скасовано",
};

const ORDER_STATUS_CLASSES: Record<OrderStatus, string> = {
  new: "bg-blue-50 text-blue-700 border-blue-200",
  called: "bg-amber-50 text-amber-700 border-amber-200",
  contacted: "bg-amber-50 text-amber-800 border-amber-200",
  postponed: "bg-purple-50 text-purple-700 border-purple-200",
  confirmed: "bg-green-50 text-green-700 border-green-200",
  cancelled: "bg-gray-100 text-gray-600 border-gray-200",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        ORDER_STATUS_CLASSES[status]
      )}
    >
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "positive" | "muted";
}) {
  const toneClasses =
    tone === "positive"
      ? "bg-green-50 text-green-700 border-green-200"
      : tone === "muted"
        ? "bg-gray-50 text-gray-500 border-gray-200"
        : "bg-accent-50 text-accent-700 border-accent-100";
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium", toneClasses)}>
      {children}
    </span>
  );
}
