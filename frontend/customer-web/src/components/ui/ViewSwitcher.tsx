"use client";

import { useState } from "react";

type View = "grid" | "list";

/**
 * Grid/list switch for any set of cards. The chosen view is written to `data-view` on the wrapper, and the
 * cards restyle themselves with Tailwind's `group-data-[view=list]/view:` variants, so the cards and the
 * pages that use them stay server components.
 */
export function ViewSwitcher({
  children,
  summary,
}: {
  children: React.ReactNode;
  /** Shown to the left of the switch, for example "12 services". */
  summary?: React.ReactNode;
}) {
  const [view, setView] = useState<View>("grid");

  return (
    <div data-view={view} className="group/view flex flex-col gap-5">
      <div className="flex items-center justify-between gap-4">
        <div className="text-sm text-ink-soft" aria-live="polite">
          {summary}
        </div>
        <div role="group" aria-label="Layout" className="inline-flex overflow-hidden rounded-md ring-1 ring-line">
          <ViewButton current={view} value="grid" label="Grid" onSelect={setView}>
            <path d="M3 3h6v6H3zM11 3h6v6h-6zM3 11h6v6H3zM11 11h6v6h-6z" />
          </ViewButton>
          <ViewButton current={view} value="list" label="List" onSelect={setView}>
            <path d="M3 4h14v3H3zM3 8.5h14v3H3zM3 13h14v3H3z" />
          </ViewButton>
        </div>
      </div>
      {children}
    </div>
  );
}

function ViewButton({
  current,
  value,
  label,
  onSelect,
  children,
}: {
  current: View;
  value: View;
  label: string;
  onSelect: (view: View) => void;
  children: React.ReactNode;
}) {
  const active = current === value;
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={() => onSelect(value)}
      className={`inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold transition-colors ${
        active ? "bg-plum text-champagne-200" : "bg-white text-ink hover:text-terracotta"
      }`}
    >
      <svg viewBox="0 0 20 20" aria-hidden="true" className="size-4 fill-current">
        {children}
      </svg>
      {label}
    </button>
  );
}
