import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { ViewSwitcher } from "@/components/ui/ViewSwitcher";
import { CARD_LIST_CLASS } from "@/components/ui/view-classes";
import { SectionGuard } from "@/components/layout/SectionGuard";
import { Eyebrow } from "@/components/layout/SectionHeading";
import { getCategories } from "@/features/categories/api";
import { getLocations, searchListings } from "@/features/marketplace/api";
import { EmptyState, Field, FilterChips, FilterPanel, Pagination, fieldClass } from "@/features/marketplace/components/Bits";
import { ListingCard } from "@/features/marketplace/components/Cards";
import { activeFilters, parseListingQuery, withParam } from "@/features/marketplace/search-params";

export const metadata: Metadata = {
  title: "Services",
  description: "Photographers, caterers, decorators, makeup artists, DJs and more — with fixed-price packages.",
};

export default function ServicesPage(props: PageProps<"/services">) {
  return (
    <>
      <Suspense fallback={null}>
        <SectionGuard section="services" />
      </Suspense>
      <ServicesPageContent {...props} />
    </>
  );
}

function ServicesPageContent(props: PageProps<"/services">) {
  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-14 sm:px-8">
      <div className="flex flex-col gap-4">
        <Eyebrow>Services</Eyebrow>
        <h1 className="font-display text-4xl leading-[1.05] tracking-tight text-ink sm:text-5xl">
          Everything your event <em className="text-terracotta">needs.</em>
        </h1>
        <p className="max-w-2xl text-ink-soft">
          Choose fixed-price packages, add them to your cart and book with an online advance.
        </p>
      </div>
      <Suspense fallback={<div aria-hidden="true" className="skeleton h-96 rounded-xl" />}>
        <ListingResults searchParams={props.searchParams} />
      </Suspense>
    </section>
  );
}

const LABELS: Record<string, string> = {
  q: "Search",
  category: "Occasion",
  service: "Service",
  city: "City",
  food: "Food",
  maxPrice: "Budget up to ₹",
  venue: "Venue",
};

async function ListingResults({ searchParams }: Pick<PageProps<"/services">, "searchParams">) {
  const query = parseListingQuery(await searchParams);
  const [result, locations, categories] = await Promise.all([searchListings(query), getLocations(), getCategories()]);
  const flat = query as Record<string, string | number | undefined>;
  const href = (key: string, value?: string | number) => withParam("/services", flat, key, value);
  const notice = result.kind === "ok" ? result.data.venueNotice : undefined;

  return (
    <div className="grid gap-8 lg:grid-cols-[18rem_1fr]">
      <form action="/services" className="lg:sticky lg:top-28 lg:self-start">
        {query.venue && <input type="hidden" name="venue" value={query.venue} />}
        {query.service && <input type="hidden" name="service" value={query.service} />}
        <FilterPanel resetHref={query.venue ? `/services?venue=${query.venue}` : "/services"}>
          <Field label="Search" htmlFor="s-q">
            <input id="s-q" name="q" defaultValue={query.q} placeholder="Photographer, mehandi…" className={fieldClass} />
          </Field>
          <Field label="Occasion" htmlFor="s-category">
            <select id="s-category" name="category" defaultValue={query.category ?? ""} className={fieldClass}>
              <option value="">Any occasion</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="City" htmlFor="s-city">
            <select id="s-city" name="city" defaultValue={query.city ?? ""} className={fieldClass}>
              <option value="">{query.venue ? "The venue's city" : "Any city"}</option>
              {locations.map((l) => (
                <option key={l.city}>{l.city}</option>
              ))}
            </select>
          </Field>
          <fieldset>
            <legend className="text-sm font-semibold text-ink">Food</legend>
            <div className="mt-2 flex flex-col gap-2 text-sm text-ink">
              {[
                ["", "Any"],
                ["VEG", "Vegetarian"],
                ["NON_VEG", "Non-vegetarian"],
              ].map(([value, label]) => (
                <label key={value} className="flex items-center gap-2">
                  <input type="radio" name="food" value={value} defaultChecked={(query.food ?? "") === value} className="accent-terracotta" />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
          <Field label="Budget up to (₹)" htmlFor="s-price">
            <input id="s-price" name="maxPrice" type="number" min={1} inputMode="numeric" defaultValue={query.maxPrice} placeholder="Starting price" className={fieldClass} />
          </Field>
          <Field label="Sort by" htmlFor="s-sort">
            <select id="s-sort" name="sort" defaultValue={query.sort ?? ""} className={fieldClass}>
              <option value="">Occasion</option>
              <option value="price_asc">Price: low to high</option>
              <option value="price_desc">Price: high to low</option>
            </select>
          </Field>
        </FilterPanel>
      </form>

      <div className="flex flex-col gap-6">
        {notice && (
          <div role="note" className="animate-fade-up rounded-xl bg-white p-5 ring-1 ring-terracotta/40">
            <p className="font-display text-xl text-ink">
              Planning at{" "}
              <Link href={`/venues/${notice.venueSlug}`} className="underline decoration-terracotta underline-offset-4">
                {notice.venueName}
              </Link>
            </p>
            <p className="mt-1 text-sm text-ink-soft">Results show vendors in the venue&apos;s city.</p>
            {notice.notAllowed.length > 0 && (
              <ul className="mt-3 flex flex-col gap-1.5">
                {notice.notAllowed.map((s) => (
                  <li key={s.serviceCode} className="flex items-center gap-2 text-sm font-medium text-terracotta-600">
                    <span aria-hidden="true">✕</span> {s.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        <FilterChips
          chips={activeFilters(flat, LABELS).map((chip) =>
            chip.key === "venue" && notice ? { ...chip, label: `Venue: ${notice.venueName}` } : chip,
          )}
          href={(key) => href(key, undefined)}
        />
        {result.kind === "invalid" ? (
          <EmptyState title="Check your filters">{result.message}</EmptyState>
        ) : result.data.items.length === 0 ? (
          <EmptyState title="No services match">
            Try another occasion or city, or{" "}
            <Link href="/services" className="font-medium text-ink underline decoration-terracotta underline-offset-4">
              clear all filters
            </Link>
            .
          </EmptyState>
        ) : (
          <>
            <ViewSwitcher summary={`${result.data.total} ${result.data.total === 1 ? "service" : "services"}`}>
            <ul className={CARD_LIST_CLASS}>
              {result.data.items.map((listing, i) => (
                <li key={listing.slug} className="stagger animate-fade-up" style={{ "--i": i } as React.CSSProperties}>
                  <ListingCard listing={listing} />
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
