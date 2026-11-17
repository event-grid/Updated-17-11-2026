import Link from "next/link";

import { CategoryIcon } from "@/components/icons/CategoryIcon";
import { categoryPresentation } from "@/config/category-presentation";
import type { ListingCard as Listing, VenueCard as Venue } from "@/lib/api/generated/public";
import { capacityLabel } from "@/lib/format";

import { DemoBadge, Price } from "./Bits";
import { FavouriteButton } from "./FavouriteButton";

/**
 * Venue and service cards. No photos are supplied yet, so each card carries the category's colour and icon
 * instead of an invented picture.
 */
export function VenueCard({ venue, venueQuery }: { venue: Venue; venueQuery?: string }) {
  const capacity = capacityLabel(venue.capacityMin, venue.capacityMax);
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-xl bg-white ring-1 ring-line transition-all duration-300 hover:-translate-y-1 hover:shadow-card group-data-[view=list]/view:flex-row">
      <div className="relative flex h-36 items-end justify-between bg-tile-peach p-4 group-data-[view=list]/view:h-auto group-data-[view=list]/view:w-52 group-data-[view=list]/view:shrink-0">
        <CategoryIcon
          name="venue"
          className="absolute right-4 top-4 size-12 text-[#ad7448] opacity-60 transition-transform duration-500 group-hover:scale-110"
        />
        <span className="rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-ink">{venue.venueType.name}</span>
        {venue.demo && <DemoBadge className="absolute left-4 top-4" />}
      </div>
      <FavouriteButton type="venue" slug={venue.slug} name={venue.name} className="absolute right-3 top-28 z-10 group-data-[view=list]/view:top-3" />
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="font-display text-2xl leading-tight text-ink">
          <Link href={`/venues/${venue.slug}${venueQuery ?? ""}`} className="after:absolute after:inset-0 focus-visible:outline-none">
            {venue.name}
          </Link>
        </h3>
        <p className="text-sm text-ink-soft">
          {[venue.area, venue.city].filter(Boolean).join(", ")}
          {capacity && <> · {capacity}</>}
        </p>
        <div className="mt-auto pt-3">
          <Price minor={venue.fromPriceMinor} from />
        </div>
      </div>
    </article>
  );
}

export function ListingCard({ listing }: { listing: Listing }) {
  const { tile, icon } = categoryPresentation(listing.categorySlug);
  const food = [listing.servesVeg && "Veg", listing.servesNonVeg && "Non-veg"].filter(Boolean).join(" · ");
  return (
    <article
      className={`group relative flex h-full flex-col overflow-hidden rounded-xl bg-white ring-1 transition-all duration-300 hover:-translate-y-1 hover:shadow-card group-data-[view=list]/view:flex-row ${
        listing.notAllowedAtVenue ? "ring-terracotta/50" : "ring-line"
      }`}
    >
      <div className={`relative flex h-28 items-end p-4 group-data-[view=list]/view:h-auto group-data-[view=list]/view:w-52 group-data-[view=list]/view:shrink-0 ${tile.bg}`}>
        <CategoryIcon name={icon} className={`absolute right-4 top-4 size-10 opacity-70 ${tile.icon}`} />
        <span className="rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-ink">{listing.serviceName}</span>
        {listing.demo && <DemoBadge className="absolute left-4 top-4" />}
      </div>
      <FavouriteButton type="listing" slug={listing.slug} name={listing.title} className="absolute right-3 top-20 z-10 group-data-[view=list]/view:top-3" />
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="font-display text-xl leading-tight text-ink">
          <Link
            href={`/vendors/${listing.provider.slug}#${listing.slug}`}
            className="after:absolute after:inset-0 focus-visible:outline-none"
          >
            {listing.title}
          </Link>
        </h3>
        <p className="text-sm text-ink-soft">
          {listing.provider.name} · {listing.city}
        </p>
        <p className="text-xs text-ink-soft">
          {listing.categoryName}
          {food && <> · {food}</>}
        </p>
        {listing.notAllowedAtVenue && (
          <p className="rounded-md bg-tile-blush/60 px-3 py-2 text-xs font-medium text-terracotta-600">
            Not allowed at your chosen venue
          </p>
        )}
        <div className="mt-auto pt-3">
          <Price minor={listing.fromPriceMinor} unit={listing.fromPriceUnit} from />
        </div>
      </div>
    </article>
  );
}
