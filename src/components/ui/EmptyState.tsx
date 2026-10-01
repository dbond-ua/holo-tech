"use client";

import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { LocalizedLink as Link } from "@/components/LocalizedLink";
import { categorySlugs } from "@/lib/data";
import { useI18n } from "@/i18n/I18nProvider";

/**
 * Empty state as a useful page, not a centered icon: a plain statement and
 * a direct way back into the catalog.
 */
export function EmptyState({
  title,
  text,
  lead,
  action,
}: {
  title: string;
  text?: string;
  lead?: string;
  action?: ReactNode;
}) {
  const { dict } = useI18n();
  const categories = categorySlugs.map((slug) => ({ slug, ...dict.categories[slug] }));

  return (
    <div className="grid grid-cols-1 gap-10 border-t border-fg pt-6 lg:grid-cols-12">
      <div className="lg:col-span-5">
        <p className="text-h3 font-semibold">{title}</p>
        {text && <p className="mt-2 max-w-sm text-fg-2">{text}</p>}
        {action && <div className="mt-6">{action}</div>}
      </div>
      <div className="lg:col-span-7">
        {lead && <p className="caption mb-3 text-fg-2">{lead}</p>}
        <ul className="border-t border-rule">
          {categories.map((c, i) => (
            <li key={c.slug}>
              <Link
                href={`/${c.slug}`}
                className="group flex items-center gap-4 border-b border-rule py-3.5 text-[15px] transition-colors hover:bg-fg/[0.03]"
              >
                <span className="spec text-fg-3">{String(i + 1).padStart(2, "0")}</span>
                <span className="flex-1 font-medium">{c.title}</span>
                <ArrowRight
                  className="h-4 w-4 text-fg-2 transition-transform duration-150 group-hover:translate-x-0.5"
                  strokeWidth={1.5}
                />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
