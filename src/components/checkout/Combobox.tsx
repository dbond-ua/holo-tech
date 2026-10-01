"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ComboboxItem {
  ref: string;
  label: string;
  sublabel?: string;
}

/**
 * A single reusable searchable dropdown, shared by the Nova Poshta city and
 * branch/parcel-locker pickers in the checkout form (never load the full
 * city or branch list into the DOM — the parent hands this component only
 * the already-filtered/paginated `items` it currently has, e.g. up to ~20
 * API search results, or the bounded set of branches for one city).
 *
 * Fully controlled: the parent owns `query` (what's typed) and `value`
 * (the committed selection, if any) and decides when a manual edit should
 * invalidate a previous selection — this component only renders and reports
 * user interaction (typing, arrow/enter navigation, clicking an option).
 */
export function Combobox({
  id,
  query,
  onQueryChange,
  items,
  onSelect,
  loading,
  disabled,
  placeholder,
  noResultsText,
  selectedLabel,
}: {
  id?: string;
  query: string;
  onQueryChange: (q: string) => void;
  items: ComboboxItem[];
  onSelect: (item: ComboboxItem) => void;
  loading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  noResultsText: string;
  /** When set and equal to the current query, the field renders as "committed" (a real selection, not free text). */
  selectedLabel?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    setHighlighted(0);
  }, [items]);

  const isCommitted = Boolean(selectedLabel && selectedLabel === query);

  return (
    <div ref={rootRef} className="relative">
      <div className="relative">
        <input
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          autoComplete="off"
          disabled={disabled}
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            onQueryChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
              setHighlighted((i) => Math.min(i + 1, items.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setHighlighted((i) => Math.max(i - 1, 0));
            } else if (e.key === "Enter") {
              if (open && items[highlighted]) {
                e.preventDefault();
                onSelect(items[highlighted]);
                setOpen(false);
              }
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          className={cn(
            "w-full rounded-xl2 border bg-transparent px-4 py-3 pr-9 text-sm outline-none transition-colors focus-visible:border-ink dark:border-line-dark dark:focus-visible:border-white disabled:opacity-50",
            isCommitted ? "border-volt-600 dark:border-volt" : "border-line dark:border-line-dark"
          )}
        />
        <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted dark:text-muted-dark">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isCommitted ? (
            <Check className="h-4 w-4 text-volt-600 dark:text-volt" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </span>
      </div>

      {open && !disabled && (
        <div className="absolute inset-x-0 top-full z-20 mt-1 max-h-60 overflow-y-auto rounded-xl2 border border-line bg-surface shadow-lift dark:border-line-dark dark:bg-surface-dark">
          {items.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted dark:text-muted-dark">
              {loading ? "…" : noResultsText}
            </p>
          ) : (
            items.map((item, i) => (
              <button
                key={item.ref}
                type="button"
                onMouseEnter={() => setHighlighted(i)}
                onClick={() => {
                  onSelect(item);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full flex-col items-start px-4 py-2.5 text-left text-sm transition-colors",
                  i === highlighted ? "bg-black/[0.04] dark:bg-white/[0.08]" : ""
                )}
              >
                <span className="font-medium">{item.label}</span>
                {item.sublabel && (
                  <span className="text-xs text-muted dark:text-muted-dark">{item.sublabel}</span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
