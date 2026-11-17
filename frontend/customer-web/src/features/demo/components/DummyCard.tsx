import Link from "next/link";

import { CategoryIcon } from "@/components/icons/CategoryIcon";
import { categoryPresentation } from "@/config/category-presentation";
import { DemoBadge, Price } from "@/features/marketplace/components/Bits";

import type { DummyListing } from "../dummy-listings";

/** A placeholder listing card. Opens the placeholder's detail page. Lays out as a row in list view. */
export function DummyCard({
  listing,
  categorySlug,
  serviceCode,
  serviceName,
}: {
  listing: DummyListing;
  categorySlug: string;
  serviceCode: string;
  serviceName: string;
}) {
  const { tile, icon } = categoryPresentation(categorySlug);
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-xl bg-white ring-1 ring-line transition-all duration-300 hover:-translate-y-1 hover:shadow-card group-data-[view=list]/view:flex-row">
      <div
        className={`relative flex h-28 items-end p-4 group-data-[view=list]/view:h-auto group-data-[view=list]/view:w-52 group-data-[view=list]/view:shrink-0 ${tile.bg}`}
      >
        <CategoryIcon name={icon} className={`absolute right-4 top-4 size-10 opacity-70 ${tile.icon}`} />
        <span className="rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-ink">{serviceName}</span>
        <DemoBadge className="absolute left-4 top-4" />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="font-display text-xl leading-tight text-ink">
          <Link
            href={`/categories/${categorySlug}/${serviceCode}/${listing.id}`}
            className="after:absolute after:inset-0 focus-visible:outline-none"
          >
            {listing.title}
          </Link>
        </h3>
        <p className="text-sm text-ink-soft">
          {listing.providerName} · {listing.city}
        </p>
        <p className="text-xs text-ink-soft">
          <span aria-hidden="true" className="text-gold">
            ★
          </span>{" "}
          {listing.rating.toFixed(1)} ({listing.reviewCount} reviews)
        </p>
        <div className="mt-auto pt-3">
          <Price minor={listing.fromPriceMinor} unit={listing.priceUnit} from />
        </div>
      </div>
    </article>
  );
}
