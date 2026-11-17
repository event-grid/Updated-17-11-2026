import Link from "next/link";

import { CategoryIcon } from "@/components/icons/CategoryIcon";
import { categoryPresentation } from "@/config/category-presentation";

import type { SearchResponse, SearchResultItem } from "../types";

import { Highlight, matchesAny } from "./Highlight";

/** Search results grouped into categories, event types and subcategories, and services. */
export function SearchResults({ response }: { response: SearchResponse }) {
  const { words, items } = response;

  if (items.length === 0) {
    return <NoResults query={response.query} />;
  }

  const categories = items.filter((i) => i.type === "CATEGORY");
  const entries = items.filter((i) => i.type === "EVENT_TYPE" || i.type === "SUBCATEGORY");
  const services = items.filter((i) => i.type === "SERVICE");

  return (
    <div className="flex flex-col gap-14">
      {categories.length > 0 && (
        <ResultGroup title="Categories" count={categories.length}>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((item) => (
              <li key={item.categorySlug}>
                <CategoryResult item={item} words={words} />
              </li>
            ))}
          </ul>
        </ResultGroup>
      )}

      {entries.length > 0 && (
        <ResultGroup title="Event types & subcategories" count={entries.length}>
          <ul className="flex flex-wrap gap-3">
            {entries.map((item) => (
              <li key={`${item.categorySlug}:${item.title}`}>
                <Link
                  href={`/categories/${item.categorySlug}`}
                  className="flex flex-col rounded-sm bg-white px-4 py-2.5 ring-1 ring-line transition-all hover:-translate-y-0.5 hover:shadow-card hover:ring-champagne focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-plum"
                >
                  <span className="text-[15px] text-ink">
                    <Highlight text={item.title} words={words} />
                  </span>
                  <span className="text-xs text-ink-soft">
                    {item.type === "EVENT_TYPE" ? "Event type" : "Subcategory"} · {item.categoryName}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </ResultGroup>
      )}

      {services.length > 0 && (
        <ResultGroup title="Services" count={services.length}>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((item) => (
              <li key={`${item.categorySlug}:${item.title}`}>
                <ServiceResult item={item} words={words} />
              </li>
            ))}
          </ul>
        </ResultGroup>
      )}
    </div>
  );
}

function ResultGroup({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  const headingId = `results-${title.toLowerCase().replace(/[^a-z]+/g, "-")}`;
  return (
    <section aria-labelledby={headingId} className="flex animate-fade-up flex-col gap-6">
      <div className="flex items-baseline justify-between gap-4 border-b border-line pb-4">
        <h2 id={headingId} className="font-display text-3xl text-ink">{title}</h2>
        <span className="text-sm text-ink-soft">
          {count} {count === 1 ? "match" : "matches"}
        </span>
      </div>
      {children}
    </section>
  );
}

function CategoryResult({ item, words }: { item: SearchResultItem; words: string[] }) {
  const { tile, icon, tagline } = categoryPresentation(item.categorySlug);
  return (
    <Link
      href={`/categories/${item.categorySlug}`}
      className={`group relative flex h-40 flex-col justify-end overflow-hidden rounded-sm p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-card active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-plum ${tile.bg}`}
    >
      <CategoryIcon name={icon} className={`absolute right-5 top-5 size-9 transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110 ${tile.icon}`} />
      <span className="font-display text-2xl leading-tight text-ink">
        <Highlight text={item.title} words={words} />
      </span>
      <span className="mt-1 text-sm text-ink-soft">{tagline}</span>
    </Link>
  );
}

function ServiceResult({ item, words }: { item: SearchResultItem; words: string[] }) {
  return (
    <Link
      href={`/categories/${item.categorySlug}`}
      className="group flex h-full flex-col gap-3 rounded-sm bg-white p-5 ring-1 ring-line transition-all duration-300 hover:-translate-y-1 hover:shadow-card hover:ring-champagne active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-plum"
    >
      <span className="flex items-start justify-between gap-3">
        <span className="font-display text-xl leading-tight text-ink">
          <Highlight text={item.title} words={words} />
        </span>
        <span aria-hidden="true" className="text-terracotta transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5">↗</span>
      </span>
      <span className="text-sm text-ink-soft">in {item.categoryName}</span>
      {item.options.length > 0 && (
        <span className="flex flex-wrap gap-1.5">
          {item.options.map((option) => (
            <span
              key={option}
              className={`rounded-sm px-2.5 py-1 text-sm ${matchesAny(option, words) ? "bg-champagne-200 text-ink ring-1 ring-champagne" : "bg-sand text-ink-soft"}`}
            >
              <Highlight text={option} words={words} />
            </span>
          ))}
        </span>
      )}
    </Link>
  );
}

function NoResults({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-start gap-5 rounded-sm border border-dashed border-line bg-white p-10">
      <p className="font-display text-3xl text-ink">
        No matches for <em className="text-terracotta">“{query}”</em>
      </p>
      <p className="text-ink-soft">
        Try a shorter or different word — for example “photo”, “venue” or “food” — or browse every category.
      </p>
      <Link
        href="/categories"
        className="inline-flex items-center gap-2 rounded-md bg-plum px-5 py-3 font-semibold text-champagne-200 transition-colors hover:bg-plum-700"
      >
        Browse event categories <span aria-hidden="true">⟶</span>
      </Link>
    </div>
  );
}

export function SearchResultsSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-10">
      <div className="h-10 w-64 skeleton rounded-sm" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-40 skeleton rounded-sm" />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="h-36 skeleton rounded-sm" />
        ))}
      </div>
    </div>
  );
}
