import Form from "next/form";

import { SEARCH_MAX_LENGTH, SEARCH_MIN_LENGTH } from "../search-limits";

/**
 * Keyword search box. Submits to /search?q=… with client-side navigation (next/form) and still
 * works without JavaScript. `compact` is the header version; the default is the search page version.
 */
export function SearchForm({
  defaultValue = "",
  compact = false,
  autoFocus = false,
  inputId = "header-search",
}: {
  defaultValue?: string;
  compact?: boolean;
  autoFocus?: boolean;
  /** Distinct id when the compact box appears twice (header and mobile menu). */
  inputId?: string;
}) {
  if (compact) {
    return (
      <Form action="/search" role="search" className="group relative w-full">
        <label htmlFor={inputId} className="sr-only">
          Search events and services
        </label>
        <SearchGlyph className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-soft transition-colors group-focus-within:text-terracotta" />
        <input
          id={inputId}
          name="q"
          type="search"
          required
          minLength={SEARCH_MIN_LENGTH}
          maxLength={SEARCH_MAX_LENGTH}
          placeholder="Search events, services…"
          className="w-full rounded-full border border-line bg-white py-2.5 pl-10 pr-4 text-sm text-ink transition-shadow placeholder:text-ink-soft/80 focus:border-terracotta focus:shadow-[0_6px_20px_-12px_rgb(217_115_90/0.6)] focus:outline-none focus:ring-2 focus:ring-terracotta/20"
        />
      </Form>
    );
  }

  return (
    <Form
      action="/search"
      role="search"
      className="flex flex-col gap-3 rounded-xl bg-white p-3 shadow-card ring-1 ring-line transition-shadow focus-within:ring-terracotta/40 sm:flex-row"
    >
      <label className="flex flex-1 items-center gap-3 px-4 py-2">
        <SearchGlyph className="size-5 shrink-0 text-terracotta" />
        <span className="sr-only">Search events and services</span>
        <input
          name="q"
          type="search"
          required
          minLength={SEARCH_MIN_LENGTH}
          maxLength={SEARCH_MAX_LENGTH}
          defaultValue={defaultValue}
          autoFocus={autoFocus}
          placeholder="Try “mehandi”, “venue” or “photography”"
          className="w-full bg-transparent py-2 text-lg text-ink placeholder:text-ink-soft/70 focus:outline-none"
        />
      </label>
      <button
        type="submit"
        className="group inline-flex items-center justify-center gap-3 rounded-lg bg-plum px-6 py-3.5 font-semibold text-champagne-200 transition-all hover:bg-plum-700 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
      >
        Search <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">⟶</span>
      </button>
    </Form>
  );
}

export function SearchGlyph({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className={className}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </svg>
  );
}
