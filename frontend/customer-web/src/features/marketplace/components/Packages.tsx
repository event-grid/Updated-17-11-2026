import Link from "next/link";

import { AddToCart } from "@/features/shopping/components/AddToCart";
import type { ListingWithPackages, VenueServiceStatus } from "@/lib/api/generated/public";

import { DemoBadge, Price } from "./Bits";
import { FavouriteButton } from "./FavouriteButton";

/** A listing with its fixed-price packages, each with an "Add to cart" form. */
export function ListingPackages({ entry, showProvider = false }: { entry: ListingWithPackages; showProvider?: boolean }) {
  const { listing, packages } = entry;
  return (
    <section id={listing.slug} aria-labelledby={`${listing.slug}-title`} className="reveal scroll-mt-28 flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-4">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-soft">
            {listing.serviceName} · {listing.categoryName}
          </p>
          <h3 id={`${listing.slug}-title`} className="font-display text-3xl text-ink">
            {listing.title}
          </h3>
          {showProvider && (
            <p className="text-sm text-ink-soft">
              by{" "}
              <Link href={`/vendors/${listing.provider.slug}`} className="font-medium text-ink underline decoration-terracotta underline-offset-4">
                {listing.provider.name}
              </Link>
            </p>
          )}
          {entry.description && <p className="mt-1 max-w-2xl text-ink-soft">{entry.description}</p>}
        </div>
        <div className="flex items-center gap-2">
          {listing.demo && <DemoBadge />}
          <FavouriteButton type="listing" slug={listing.slug} name={listing.title} />
        </div>
      </div>
      {packages.length === 0 ? (
        <p className="text-ink-soft">No packages are offered right now.</p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {packages.map((pkg) => (
            <li key={pkg.id} className="flex flex-col gap-4 rounded-xl bg-white p-5 ring-1 ring-line transition-shadow hover:shadow-card">
              <div className="flex flex-col gap-1">
                <h4 className="font-display text-2xl leading-tight text-ink">{pkg.title}</h4>
                <Price minor={pkg.priceMinor} unit={pkg.priceUnit} />
                {pkg.priceUnit === "PER_GUEST" && (
                  <p className="text-xs text-ink-soft">
                    {pkg.minQuantity.toLocaleString("en-IN")} to {pkg.maxQuantity.toLocaleString("en-IN")} guests
                  </p>
                )}
              </div>
              {pkg.description && <p className="text-sm text-ink-soft">{pkg.description}</p>}
              {pkg.inclusions.length > 0 && (
                <ul className="flex flex-wrap gap-1.5" aria-label="Included">
                  {pkg.inclusions.map((item) => (
                    <li key={item} className="rounded-sm bg-sand px-2.5 py-1 text-xs text-ink">
                      ✓ {item}
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-auto border-t border-line pt-4">
                <AddToCart pkg={pkg} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

const STATUS_STYLE: Record<string, { icon: string; className: string; label: string }> = {
  NOT_ALLOWED: { icon: "✕", className: "bg-tile-blush/70 text-terracotta-600 ring-terracotta/30", label: "Not allowed" },
  PROVIDED: { icon: "★", className: "bg-tile-mint/70 text-[#3f6b51] ring-[#5c8a6e]/30", label: "Provided by the venue" },
  ALLOWED: { icon: "✓", className: "bg-tile-sage/60 text-ink ring-line", label: "Outside vendors allowed" },
};

/**
 * What the venue owner has stated about each service (SR-2). "Not allowed" is never hidden: it is listed first,
 * with the owner's message. Services the owner has not stated anything about are not listed (ADR-018).
 */
export function VenueServices({ services, venueSlug }: { services: VenueServiceStatus[]; venueSlug: string }) {
  if (services.length === 0) {
    return <p className="text-ink-soft">The owner has not stated which services are allowed. Ask the venue before booking vendors.</p>;
  }
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {services.map((s) => {
        const style = STATUS_STYLE[s.status] ?? STATUS_STYLE.ALLOWED;
        return (
          <li key={s.serviceCode} className={`flex items-start gap-3 rounded-lg px-4 py-3 ring-1 ${style.className}`}>
            <span aria-hidden="true" className="mt-0.5 font-semibold">
              {style.icon}
            </span>
            <span className="flex flex-col">
              <span className="text-sm font-semibold">
                {s.serviceName} <span className="sr-only">— {style.label}</span>
              </span>
              <span className="text-sm">{s.message}</span>
              {s.status === "ALLOWED" && (
                <Link
                  href={`/services?venue=${venueSlug}&service=${s.serviceCode}`}
                  className="mt-1 text-xs font-semibold text-terracotta underline underline-offset-4"
                >
                  Find {s.serviceName.toLowerCase()} vendors for this venue
                </Link>
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
