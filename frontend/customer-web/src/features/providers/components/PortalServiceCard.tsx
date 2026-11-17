import Link from "next/link";

import { CategoryIcon } from "@/components/icons/CategoryIcon";
import { categoryPresentation } from "@/config/category-presentation";
import { Price } from "@/features/marketplace/components/Bits";
import type { PublicProvider, ServiceDetails } from "@/lib/provider-store";

/** A service a registered provider has filled in (prototype data), shown among a service's listings. Grid or list. */
export function PortalServiceCard({ provider, service }: { provider: PublicProvider; service: ServiceDetails }) {
  const { tile, icon } = categoryPresentation(service.categorySlug);
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-xl bg-white ring-1 ring-terracotta/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-card group-data-[view=list]/view:flex-row">
      <div className={`relative flex h-28 items-end p-4 group-data-[view=list]/view:h-auto group-data-[view=list]/view:w-52 group-data-[view=list]/view:shrink-0 ${tile.bg}`}>
        <CategoryIcon name={icon} className={`absolute right-4 top-4 size-10 opacity-70 ${tile.icon}`} />
        <span className="rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-ink">{service.serviceName}</span>
        <span className="absolute left-4 top-4 rounded-full bg-terracotta px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-white">
          Registered
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="font-display text-xl leading-tight text-ink">
          <Link href={`/vendors/${provider.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none">
            {provider.name}
          </Link>
        </h3>
        <p className="text-sm text-ink-soft">{[provider.area, provider.city].filter(Boolean).join(", ")}</p>
        <p className="line-clamp-2 text-xs text-ink-soft">{service.description}</p>
        {service.startingPriceRupees != null && (
          <div className="mt-auto pt-3">
            <Price minor={service.startingPriceRupees * 100} unit={service.priceUnit} from />
          </div>
        )}
      </div>
    </article>
  );
}
