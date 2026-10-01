"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface TabItem {
  key: string;
  label: string;
  content: ReactNode;
}

export function Tabs({ items, defaultKey }: { items: TabItem[]; defaultKey?: string }) {
  const [active, setActive] = useState(defaultKey ?? items[0]?.key);
  const activeItem = items.find((i) => i.key === active) ?? items[0];

  return (
    <div>
      <div
        role="tablist"
        aria-label="Информация о товаре"
        className="no-scrollbar flex gap-1 overflow-x-auto border-b border-line dark:border-line-dark"
      >
        {items.map((item) => (
          <button
            key={item.key}
            role="tab"
            aria-selected={active === item.key}
            onClick={() => setActive(item.key)}
            className={cn(
              "relative shrink-0 px-4 py-3 text-sm font-medium transition-colors",
              active === item.key
                ? "text-ink dark:text-ink-dark"
                : "text-muted hover:text-ink dark:text-muted-dark dark:hover:text-ink-dark"
            )}
          >
            {item.label}
            {active === item.key && (
              <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-ink dark:bg-ink-dark" />
            )}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="animate-fade-in py-6">
        {activeItem?.content}
      </div>
    </div>
  );
}
