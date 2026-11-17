import Link from "next/link";

import { CategoryIcon } from "@/components/icons/CategoryIcon";
import { categoryPresentation } from "@/config/category-presentation";
import { DemoBadge, Price } from "@/features/marketplace/components/Bits";

import type { DummyVendor } from "../vendors";

/** A demo vendor (provider) on the Providers page. Opens the vendor's profile. Lays out as a row in list view. */
export function DummyVendorCard({ vendor }: { vendor: DummyVendor }) {
  const { tile, icon } = categoryPresentation(vendor.categorySlug);
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-xl bg-white ring-1 ring-line transition-all duration-300 hover:-translate-y-1 hover:shadow-card group-data-[view=list]/view:flex-row">
      <div className={`relative flex h-28 items-end p-4 group-data-[view=list]/view:h-auto group-data-[view=list]/view:w-52 group-data-[view=list]/view:shrink-0 ${tile.bg}`}>
        <CategoryIcon name={icon} className={`absolute right-4 top-4 size-10 opacity-70 ${tile.icon}`} />
        <span className="rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-ink">{vendor.serviceName}</span>
        <DemoBadge className="absolute left-4 top-4" />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="font-display text-xl leading-tight text-ink">
          <Link href={`/vendors/${vendor.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none">
            {vendor.name}
          </Link>
        </h3>
        <p className="text-sm text-ink-soft">
          {vendor.area}, {vendor.city}
        </p>
        <p className="text-xs text-ink-soft">
          {vendor.categoryName} ·{" "}
          <span aria-hidden="true" className="text-gold">
            ★
          </span>{" "}
          {vendor.rating.toFixed(1)} ({vendor.reviewCount} reviews)
        </p>
        <div className="mt-auto pt-3">
          <Price minor={vendor.fromPriceMinor} unit={vendor.priceUnit} from />
        </div>
      </div>
    </article>
  );
}
