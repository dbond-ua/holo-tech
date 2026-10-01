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
      <div role="tablist" className="no-scrollbar flex gap-6 overflow-x-auto border-b border-rule">
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={active === item.key}
            onClick={() => setActive(item.key)}
            className={cn(
              "relative shrink-0 py-3 text-sm font-medium transition-colors",
              active === item.key ? "text-fg" : "text-fg-2 hover:text-fg"
            )}
          >
            {item.label}
            {active === item.key && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-fg" />}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="py-6">
        {activeItem?.content}
      </div>
    </div>
  );
}
