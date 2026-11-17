import Link from "next/link";

import { formatRupees, unitSuffix } from "@/lib/format";

/** Marks development demo data so no one mistakes it for a real business. */
export function DemoBadge({ className = "" }: { className?: string }) {
  return (
    <span
      title="Demo data for development — not a real business"
      className={`inline-flex items-center rounded-full bg-plum/90 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-champagne-200 ${className}`}
    >
      Demo
    </span>
  );
}

export function Price({ minor, unit, from = false }: { minor?: number | null; unit?: string | null; from?: boolean }) {
  if (minor == null) {
    return <span className="text-sm text-ink-soft">Price on the vendor page</span>;
  }
  return (
    <span className="text-sm text-ink-soft">
      {from && "From "}
      <strong className="font-display text-xl font-semibold text-ink">{formatRupees(minor)}</strong>
      {unitSuffix(unit)}
    </span>
  );
}

export function Pagination({
  page,
  size,
  total,
  href,
}: {
  page: number;
  size: number;
  total: number;
  href: (page: number) => string;
}) {
  const pages = Math.ceil(total / size);
  if (pages <= 1) return null;
  return (
    <nav aria-label="Pages" className="flex items-center justify-center gap-2">
      {page > 1 && (
        <Link href={href(page - 1)} className="rounded-md px-4 py-2 text-sm font-semibold text-ink ring-1 ring-line hover:text-terracotta">
          ← Previous
        </Link>
      )}
      <span className="px-3 text-sm text-ink-soft">
        Page {page} of {pages}
      </span>
      {page < pages && (
        <Link href={href(page + 1)} className="rounded-md px-4 py-2 text-sm font-semibold text-ink ring-1 ring-line hover:text-terracotta">
          Next →
        </Link>
      )}
    </nav>
  );
}

export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-4 rounded-sm border border-dashed border-line bg-white p-10">
      <p className="font-display text-3xl text-ink">{title}</p>
      {children && <div className="text-ink-soft">{children}</div>}
    </div>
  );
}

export function FilterChips({ chips, href }: { chips: { key: string; label: string }[]; href: (key: string) => string }) {
  if (chips.length === 0) return null;
  return (
    <ul className="flex flex-wrap items-center gap-2" aria-label="Active filters">
      {chips.map((chip) => (
        <li key={chip.key}>
          <Link
            href={href(chip.key)}
            aria-label={`Remove filter ${chip.label}`}
            className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm text-ink ring-1 ring-line transition-colors hover:ring-terracotta"
          >
            {chip.label} <span aria-hidden="true" className="text-terracotta">×</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Shared form controls for the filter panels (plain GET forms: they work without JavaScript). */
export const fieldClass =
  "mt-1.5 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink focus:border-terracotta focus:outline-none focus:ring-2 focus:ring-terracotta/20";
export const labelClass = "block text-sm font-semibold text-ink";

export function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className={labelClass}>
        {label}
      </label>
      {children}
    </div>
  );
}

/** The filter panel: a sidebar on large screens, a collapsible drawer above results on small ones. */
export function FilterPanel({ children, resetHref }: { children: React.ReactNode; resetHref: string }) {
  return (
    <details className="group rounded-xl bg-white ring-1 ring-line lg:open:block" open>
      <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 font-semibold text-ink lg:pointer-events-none">
        Filters
        <span aria-hidden="true" className="text-ink-soft transition-transform group-open:rotate-180 lg:hidden">
          ⌄
        </span>
      </summary>
      <div className="flex flex-col gap-5 border-t border-line px-5 pb-5 pt-4">
        {children}
        <div className="flex gap-3">
          <button
            type="submit"
            className="flex-1 rounded-md bg-plum px-4 py-3 text-sm font-semibold text-champagne-200 transition-colors hover:bg-plum-700"
          >
            Apply filters
          </button>
          <Link href={resetHref} className="rounded-md px-4 py-3 text-sm font-semibold text-ink ring-1 ring-line hover:text-terracotta">
            Reset
          </Link>
        </div>
      </div>
    </details>
  );
}
