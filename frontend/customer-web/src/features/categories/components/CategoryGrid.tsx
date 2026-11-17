import Link from "next/link";

import { CategoryIcon } from "@/components/icons/CategoryIcon";
import { ViewSwitcher } from "@/components/ui/ViewSwitcher";
import { categoryPresentation } from "@/config/category-presentation";

import { getCategories } from "../api";
import type { CategorySummary } from "../types";

/**
 * All event categories (homepage and /categories): the main categories as large coloured tiles,
 * then the remaining ones grouped under "Other categories". Cached with the catalogue.
 */
export async function CategoryGrid({ switchable = false }: { switchable?: boolean }) {
  const categories = await getCategories();

  if (categories.length === 0) {
    return <p className="text-ink-soft">No event categories are available right now.</p>;
  }

  const featured = categories.filter((c) => categoryPresentation(c.slug).group === "featured");
  const other = categories.filter((c) => categoryPresentation(c.slug).group === "other");

  const tiles = (
    <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 group-data-[view=list]/view:grid-cols-1 group-data-[view=list]/view:lg:grid-cols-1">
      {featured.map((category) => (
        <li key={category.slug} className="reveal">
          <CategoryTile category={category} />
        </li>
      ))}
    </ul>
  );

  return (
    <div className="flex flex-col gap-14">
      {switchable ? <ViewSwitcher summary={`${categories.length} event categories`}>{tiles}</ViewSwitcher> : tiles}
      {other.length > 0 && <OtherCategories categories={other} />}
    </div>
  );
}

function CategoryTile({ category }: { category: CategorySummary }) {
  const { tile, icon, tagline } = categoryPresentation(category.slug);

  return (
    <Link
      href={`/categories/${category.slug}`}
      prefetch={true}
      className={`group relative flex h-44 flex-col justify-end overflow-hidden rounded-sm p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-card active:translate-y-0 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-plum sm:h-60 sm:p-6 group-data-[view=list]/view:h-24 group-data-[view=list]/view:sm:h-24 ${tile.bg}`}
    >
      {/* Soft light that grows from the corner on hover */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 size-48 scale-50 rounded-full bg-white/40 opacity-0 blur-2xl transition-all duration-700 group-hover:scale-100 group-hover:opacity-100"
      />
      <CategoryIcon
        name={icon}
        className={`absolute right-4 top-4 size-9 transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110 sm:right-6 sm:top-6 sm:size-11 ${tile.icon}`}
      />
      <h3 className="relative font-display text-xl font-medium leading-tight text-ink sm:text-[26px]">{category.name}</h3>
      <span className="relative mt-1.5 flex items-end justify-between gap-3 text-xs text-ink-soft sm:text-sm">
        <span className="line-clamp-2">{tagline}</span>
        <span aria-hidden="true" className="hidden text-base text-ink transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 sm:inline">
          ↗
        </span>
      </span>
    </Link>
  );
}

function OtherCategories({ categories }: { categories: CategorySummary[] }) {
  return (
    <section aria-labelledby="other-categories-heading" className="flex flex-col gap-6">
      <div className="flex items-baseline justify-between gap-4 border-b border-line pb-4">
        <h3 id="other-categories-heading" className="font-display text-3xl text-ink">
          Other <em className="text-terracotta">categories</em>
        </h3>
        <span className="hidden text-sm text-ink-soft sm:block">Surprises, corporate, campus and outdoor occasions</span>
      </div>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((category) => {
          const { tile, icon, tagline } = categoryPresentation(category.slug);
          return (
            <li key={category.slug} className="reveal">
              <Link
                href={`/categories/${category.slug}`}
                prefetch={true}
                className="group flex h-full items-center gap-4 rounded-sm bg-white p-4 ring-1 ring-line transition-all hover:-translate-y-0.5 hover:shadow-card hover:ring-champagne active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-plum"
              >
                <span className={`flex size-14 shrink-0 items-center justify-center rounded-sm transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-3 ${tile.bg}`}>
                  <CategoryIcon name={icon} className={`size-7 ${tile.icon}`} />
                </span>
                <span className="flex flex-1 flex-col">
                  <span className="font-display text-lg leading-snug text-ink">{category.name}</span>
                  <span className="text-xs text-ink-soft">{tagline}</span>
                </span>
                <span aria-hidden="true" className="text-terracotta transition-transform group-hover:translate-x-0.5">
                  ↗
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function CategoryGridSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-14">
      <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <li key={i} className="skeleton h-44 rounded-sm sm:h-60" />
        ))}
      </ul>
      <div className="skeleton h-24 rounded-sm" />
    </div>
  );
}

/** "For every occasion" strip: the main category names in a row. */
export async function OccasionStrip() {
  const categories = await getCategories();
  const names = categories
    .filter((c) => categoryPresentation(c.slug).group === "featured")
    .map((c) => c.name);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 border-y border-line px-4 py-5 sm:px-8">
      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-ink">For every occasion</span>
      <ul className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-soft">
        {names.map((name, i) => (
          <li key={name} className="flex items-center gap-3">
            {i > 0 && <span aria-hidden="true">·</span>}
            {name}
          </li>
        ))}
        <li className="flex items-center gap-3">
          <span aria-hidden="true">·</span>and more
        </li>
      </ul>
    </div>
  );
}
