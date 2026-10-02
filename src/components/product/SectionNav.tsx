"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * In-page navigation for the product page. All content stays on the page
 * (no tabs hiding specs); this bar pins under the header and underlines the
 * section in view.
 */
export function SectionNav({ items }: { items: { id: string; label: string }[] }) {
  const [active, setActive] = useState(items[0]?.id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-140px 0px -55% 0px" }
    );
    items.forEach((i) => {
      const el = document.getElementById(i.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav
      aria-label="Розділи сторінки"
      className="sticky top-14 z-30 -mx-4 border-b border-rule bg-paper/95 backdrop-blur sm:-mx-6 lg:top-[110px] lg:mx-0"
    >
      <ul className="no-scrollbar flex gap-6 overflow-x-auto px-4 sm:px-6 lg:gap-8 lg:px-0">
        {items.map((i) => (
          <li key={i.id} className="shrink-0">
            <a
              href={`#${i.id}`}
              className={cn(
                "relative flex h-12 items-center text-sm transition-colors",
                active === i.id ? "font-medium text-fg" : "text-fg-2 hover:text-fg"
              )}
            >
              {i.label}
              {active === i.id && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-fg" />}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
