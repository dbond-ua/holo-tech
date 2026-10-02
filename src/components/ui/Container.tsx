import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** 12-col shell: 1360px max, 16 / 24 / 40px side margins. */
export function Container({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mx-auto w-full max-w-shell px-4 sm:px-6 lg:px-10", className)} {...props} />;
}
