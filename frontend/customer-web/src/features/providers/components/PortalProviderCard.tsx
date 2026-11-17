import Link from "next/link";

import { CategoryIcon } from "@/components/icons/CategoryIcon";
import { DemoBadge } from "@/features/marketplace/components/Bits";
import type { PublicProvider } from "@/lib/provider-store";

/** A provider who registered in provider-portal or was added by an administrator (prototype data). Grid or list. */
export function PortalProviderCard({ provider }: { provider: PublicProvider }) {
  const services = provider.services.map((s) => s.serviceName);
  const shown = services.slice(0, 4);
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-xl bg-white ring-1 ring-line transition-all duration-300 hover:-translate-y-1 hover:shadow-card group-data-[view=list]/view:flex-row">
      <div className="relative flex h-28 items-end bg-tile-lilac p-4 group-data-[view=list]/view:h-auto group-data-[view=list]/view:w-52 group-data-[view=list]/view:shrink-0">
        <CategoryIcon name="venue" className="absolute right-4 top-4 size-10 text-plum-500 opacity-50" />
        <span className="rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-ink">
          {provider.type === "COMPANY" ? "Business" : "Individual"}
        </span>
        <DemoBadge className="absolute left-4 top-4" />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="font-display text-xl leading-tight text-ink">
          <Link href={`/vendors/${provider.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none">
            {provider.name}
          </Link>
        </h3>
        <p className="text-sm text-ink-soft">{[provider.area, provider.city].filter(Boolean).join(", ")}</p>
        <ul aria-label="Services" className="flex flex-wrap gap-1.5">
          {shown.map((name) => (
            <li key={name} className="rounded-sm bg-sand px-2.5 py-0.5 text-xs text-ink">
              {name}
            </li>
          ))}
          {services.length > shown.length && <li className="px-1 text-xs text-ink-soft">+{services.length - shown.length} more</li>}
        </ul>
      </div>
    </article>
  );
}
