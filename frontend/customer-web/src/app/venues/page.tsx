import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { ViewSwitcher } from "@/components/ui/ViewSwitcher";
import { CARD_LIST_CLASS } from "@/components/ui/view-classes";
import { SectionGuard } from "@/components/layout/SectionGuard";
import { Eyebrow } from "@/components/layout/SectionHeading";
import { getCategories } from "@/features/categories/api";
import { getLocations, getVenueTypes, searchVenues } from "@/features/marketplace/api";
import {
  EmptyState,
  Field,
  FilterChips,
  FilterPanel,
  Pagination,
  fieldClass,
} from "@/features/marketplace/components/Bits";
import { VenueCard } from "@/features/marketplace/components/Cards";
import { activeFilters, parseVenueQuery, withParam } from "@/features/marketplace/search-params";

export const metadata: Metadata = {
  title: "Venues",
  description: "Find choultries, halls, banquets, party halls, resorts, open grounds and auditoriums.",
};

export default function VenuesPage(props: PageProps<"/venues">) {
  return (
    <>
      <Suspense fallback={null}>
        <SectionGuard section="venues" />
      </Suspense>
      <VenuesPageContent {...props} />
    </>
  );
}

function VenuesPageContent(props: PageProps<"/venues">) {
  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-14 sm:px-8">
      <div className="flex flex-col gap-4">
        <Eyebrow>Venues</Eyebrow>
        <h1 className="font-display text-4xl leading-[1.05] tracking-tight text-ink sm:text-5xl">
          Find the right <em className="text-terracotta">place.</em>
        </h1>
        <p className="max-w-2xl text-ink-soft">
          Each venue shows what its owner allows — so you know before you book which vendors you can bring.
        </p>
      </div>
      <Suspense fallback={<ResultsSkeleton />}>
        <VenueResults searchParams={props.searchParams} />
      </Suspense>
    </section>
  );
}

const LABELS: Record<string, string> = { q: "Search", city: "City", type: "Type", guests: "Guests", maxPrice: "Budget up to ₹", category: "Occasion" };

async function VenueResults({ searchParams }: Pick<PageProps<"/venues">, "searchParams">) {
  const query = parseVenueQuery(await searchParams);
  const [result, types, locations, categories] = await Promise.all([
    searchVenues(query),
    getVenueTypes(),
    getLocations(),
    getCategories(),
  ]);
  const flat = query as Record<string, string | number | undefined>;
  const href = (key: string, value?: string | number) => withParam("/venues", flat, key, value);

  return (
    <div className="grid gap-8 lg:grid-cols-[18rem_1fr]">
      <form action="/venues" className="lg:sticky lg:top-28 lg:self-start">
        <FilterPanel resetHref="/venues">
          <Field label="Search" htmlFor="v-q">
            <input id="v-q" name="q" defaultValue={query.q} placeholder="Name or area" className={fieldClass} />
          </Field>
          <Field label="City" htmlFor="v-city">
            <select id="v-city" name="city" defaultValue={query.city ?? ""} className={fieldClass}>
              <option value="">Any city</option>
              {locations.map((l) => (
                <option key={l.city}>{l.city}</option>
              ))}
            </select>
          </Field>
          <Field label="Venue type" htmlFor="v-type">
            <select id="v-type" name="type" defaultValue={query.type ?? ""} className={fieldClass}>
              <option value="">Any type</option>
              {types.map((t) => (
                <option key={t.code} value={t.code}>
                  {t.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Occasion" htmlFor="v-category">
            <select id="v-category" name="category" defaultValue={query.category ?? ""} className={fieldClass}>
              <option value="">Any occasion</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Guests" htmlFor="v-guests">
            <input id="v-guests" name="guests" type="number" min={1} inputMode="numeric" defaultValue={query.guests} placeholder="e.g. 300" className={fieldClass} />
          </Field>
          <Field label="Budget up to (₹)" htmlFor="v-price">
            <input id="v-price" name="maxPrice" type="number" min={1} inputMode="numeric" defaultValue={query.maxPrice} placeholder="e.g. 150000" className={fieldClass} />
          </Field>
          <Field label="Sort by" htmlFor="v-sort">
            <select id="v-sort" name="sort" defaultValue={query.sort ?? ""} className={fieldClass}>
              <option value="">Name</option>
              <option value="price_asc">Price: low to high</option>
              <option value="price_desc">Price: high to low</option>
              <option value="capacity">Largest first</option>
            </select>
          </Field>
        </FilterPanel>
      </form>

      <div className="flex flex-col gap-6">
        <FilterChips chips={activeFilters(flat, LABELS)} href={(key) => href(key, undefined)} />
        {result.kind === "invalid" ? (
          <EmptyState title="Check your filters">{result.message}</EmptyState>
        ) : result.data.items.length === 0 ? (
          <EmptyState title="No venues match">
            Try another city or type, fewer guests or a higher budget — or{" "}
            <Link href="/venues" className="font-medium text-ink underline decoration-terracotta underline-offset-4">
              clear all filters
            </Link>
            .
          </EmptyState>
        ) : (
          <>
            <ViewSwitcher summary={`${result.data.total} ${result.data.total === 1 ? "venue" : "venues"}`}>
            <ul className={CARD_LIST_CLASS}>
              {result.data.items.map((venue, i) => (
                <li key={venue.slug} className="stagger animate-fade-up" style={{ "--i": i } as React.CSSProperties}>
                  <VenueCard venue={venue} />
                </li>
              ))}
            </ul>
            </ViewSwitcher>
            <Pagination page={result.data.page} size={result.data.size} total={result.data.total} href={(p) => href("page", p)} />
          </>
        )}
      </div>
    </div>
  );
}

function ResultsSkeleton() {
  return (
    <div aria-hidden="true" className="grid gap-8 lg:grid-cols-[18rem_1fr]">
      <div className="skeleton h-96 rounded-xl" />
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="skeleton h-72 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
