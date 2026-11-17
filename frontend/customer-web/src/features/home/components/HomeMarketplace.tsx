import Link from "next/link";

import { SectionHeading } from "@/components/layout/SectionHeading";
import { getLocations, searchListings, searchVenues } from "@/features/marketplace/api";
import { fieldClass } from "@/features/marketplace/components/Bits";
import { ListingCard, VenueCard } from "@/features/marketplace/components/Cards";

import { STEPS } from "../how-it-works";

/** Homepage: a venue finder (city and guests) with the first venues. Shows nothing invented when there are none. */
export async function FeaturedVenues() {
  const [venues, locations] = await Promise.all([searchVenues({ page: 1 }), getLocations()]);
  const items = venues.kind === "ok" ? venues.data.items.slice(0, 4) : [];

  return (
    <section aria-labelledby="venues-heading" className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-20 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SectionHeading id="venues-heading" eyebrow="Venues" title={<>Find the right <em className="text-terracotta">place</em></>} />
        <form action="/venues" className="flex w-full flex-wrap items-end gap-3 rounded-xl bg-white p-3 ring-1 ring-line sm:w-auto">
          <label className="min-w-36 flex-1 text-xs font-semibold uppercase tracking-wider text-ink-soft">
            City
            <select name="city" className={fieldClass} defaultValue="">
              <option value="">Any city</option>
              {locations.map((l) => (
                <option key={l.city}>{l.city}</option>
              ))}
            </select>
          </label>
          <label className="w-32 text-xs font-semibold uppercase tracking-wider text-ink-soft">
            Guests
            <input name="guests" type="number" min={1} inputMode="numeric" placeholder="300" className={fieldClass} />
          </label>
          <button type="submit" className="rounded-lg bg-plum px-5 py-2.5 font-semibold text-champagne-200 transition-all hover:bg-plum-700 active:scale-[0.98]">
            Find venues
          </button>
        </form>
      </div>
      {items.length === 0 ? (
        <p className="text-ink-soft">Venues will appear here as they join EVENTGRID.</p>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((venue) => (
            <li key={venue.slug} className="reveal">
              <VenueCard venue={venue} />
            </li>
          ))}
        </ul>
      )}
      <Link href="/venues" className="self-start font-semibold text-terracotta hover:text-terracotta-600">
        All venues →
      </Link>
    </section>
  );
}

export async function FeaturedServices() {
  const listings = await searchListings({ page: 1 });
  const items = listings.kind === "ok" ? listings.data.items.slice(0, 6) : [];
  return (
    <section aria-labelledby="services-heading" className="bg-sand/60">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-20 sm:px-8">
        <SectionHeading id="services-heading" eyebrow="Services" title={<>Packages with <em className="text-terracotta">clear prices</em></>} />
        {items.length === 0 ? (
          <p className="text-ink-soft">Service packages will appear here as vendors join EVENTGRID.</p>
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((listing) => (
              <li key={listing.slug} className="reveal">
                <ListingCard listing={listing} />
              </li>
            ))}
          </ul>
        )}
        <Link href="/services" className="self-start font-semibold text-terracotta hover:text-terracotta-600">
          All services →
        </Link>
      </div>
    </section>
  );
}

export function HowItWorksStrip() {
  return (
    <section aria-labelledby="how-heading" className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-20 sm:px-8">
      <SectionHeading id="how-heading" eyebrow="How EVENTGRID works" title={<>Plan it, book it, <em className="text-terracotta">celebrate.</em></>} />
      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {STEPS.map((step, i) => (
          <li key={step.title} className="reveal flex flex-col gap-3 rounded-xl bg-white p-5 ring-1 ring-line">
            <span className="font-display text-4xl italic text-terracotta">{i + 1}</span>
            <span className="font-display text-xl text-ink">{step.title}</span>
            <span className="text-sm text-ink-soft">{step.body}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function CallToAction() {
  return (
    <section className="px-4 pb-20 sm:px-8">
      <div className="reveal relative mx-auto flex w-full max-w-7xl flex-col items-start gap-6 overflow-hidden rounded-2xl bg-plum px-8 py-14 text-champagne-200 sm:px-14">
        <div aria-hidden="true" className="absolute -right-16 -top-16 size-72 animate-float rounded-full border border-champagne/20" />
        <div aria-hidden="true" className="absolute -bottom-24 right-24 size-56 rounded-full border border-dashed border-champagne/20" />
        <h2 className="relative max-w-2xl font-display text-4xl leading-tight text-champagne sm:text-5xl">
          Your celebration, <em className="text-terracotta">one cart away.</em>
        </h2>
        <p className="relative max-w-xl">Pick a venue, add the services you need and secure them with a small online advance.</p>
        <div className="relative flex flex-wrap gap-3">
          <Link href="/venues" className="rounded-md bg-terracotta px-6 py-3.5 font-semibold text-white transition-all hover:bg-terracotta-600 active:scale-[0.98]">
            Start with a venue
          </Link>
          <Link href="/how-it-works" className="rounded-md px-6 py-3.5 font-semibold text-champagne-200 ring-1 ring-champagne/40 hover:bg-plum-700">
            How it works
          </Link>
        </div>
      </div>
    </section>
  );
}
