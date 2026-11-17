import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { CategoryIcon } from "@/components/icons/CategoryIcon";
import { SectionGuard } from "@/components/layout/SectionGuard";
import { Eyebrow } from "@/components/layout/SectionHeading";
import { getVenue } from "@/features/marketplace/api";
import { DemoBadge, Price } from "@/features/marketplace/components/Bits";
import { FavouriteButton } from "@/features/marketplace/components/FavouriteButton";
import { ListingPackages, VenueServices } from "@/features/marketplace/components/Packages";
import { capacityLabel } from "@/lib/format";

export async function generateMetadata({ params }: PageProps<"/venues/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const venue = await getVenue(slug);
  return { title: venue?.venue.name ?? "Venue not found" };
}

export default function VenuePage(props: PageProps<"/venues/[slug]">) {
  return (
    <>
      <Suspense fallback={null}>
        <SectionGuard section="venues" />
      </Suspense>
      <VenuePageContent {...props} />
    </>
  );
}

function VenuePageContent(props: PageProps<"/venues/[slug]">) {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-8">
      <Suspense fallback={<div aria-hidden="true" className="skeleton h-96 rounded-xl" />}>
        <VenueDetail params={props.params} />
      </Suspense>
    </div>
  );
}

async function VenueDetail({ params }: Pick<PageProps<"/venues/[slug]">, "params">) {
  const { slug } = await params;
  const detail = await getVenue(slug);
  if (!detail) notFound();
  const { venue } = detail;
  const capacity = capacityLabel(venue.capacityMin, venue.capacityMax);

  return (
    <article className="flex flex-col gap-14">
      <header className="flex flex-col gap-6">
        <nav aria-label="Breadcrumb" className="text-sm text-ink-soft">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/" className="hover:text-terracotta">Home</Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/venues" className="hover:text-terracotta">Venues</Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-ink">{venue.name}</li>
          </ol>
        </nav>
        <div className="relative overflow-hidden rounded-xl bg-tile-peach px-6 py-12 sm:px-12">
          <CategoryIcon name="venue" className="absolute -right-6 -top-6 size-56 animate-float text-[#ad7448] opacity-20 sm:right-10 sm:top-8" />
          <div className="relative flex max-w-3xl flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <Eyebrow>{venue.venueType.name}</Eyebrow>
              {venue.demo && <DemoBadge />}
            </div>
            <h1 className="animate-fade-up font-display text-4xl leading-[1.05] tracking-tight text-ink sm:text-6xl">{venue.name}</h1>
            <p className="text-ink-soft">
              {[venue.area, venue.city].filter(Boolean).join(", ")}
              {capacity && <> · {capacity}</>} · by{" "}
              <Link href={`/vendors/${venue.provider.slug}`} className="font-medium text-ink underline decoration-terracotta underline-offset-4">
                {venue.provider.name}
              </Link>
            </p>
            {detail.description && <p className="max-w-2xl text-lg text-ink">{detail.description}</p>}
            <div className="flex flex-wrap items-center gap-4">
              <Price minor={venue.fromPriceMinor} from />
              <FavouriteButton type="venue" slug={venue.slug} name={venue.name} />
              <Link
                href={`/services?venue=${venue.slug}`}
                className="rounded-md bg-plum px-5 py-3 text-sm font-semibold text-champagne-200 transition-all hover:bg-plum-700 active:scale-[0.98]"
              >
                Find vendors for this venue →
              </Link>
            </div>
            {detail.suitableFor.length > 0 && (
              <p className="text-sm text-ink-soft">Listed for: {detail.suitableFor.join(", ")}</p>
            )}
          </div>
        </div>
      </header>

      <section aria-labelledby="rules-heading" className="reveal flex flex-col gap-5">
        <h2 id="rules-heading" className="border-b border-line pb-4 font-display text-3xl text-ink">
          Services at this venue
        </h2>
        <VenueServices services={detail.services} venueSlug={venue.slug} />
      </section>

      <section aria-labelledby="packages-heading" className="flex flex-col gap-8">
        <h2 id="packages-heading" className="font-display text-3xl text-ink">
          Book this venue
        </h2>
        {detail.listings.length === 0 ? (
          <p className="text-ink-soft">This venue has no packages to book online yet.</p>
        ) : (
          detail.listings.map((entry) => <ListingPackages key={entry.listing.slug} entry={entry} />)
        )}
      </section>
    </article>
  );
}
