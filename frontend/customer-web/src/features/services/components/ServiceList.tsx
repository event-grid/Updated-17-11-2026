import Link from "next/link";

import { CARD_LIST_CLASS } from "@/components/ui/view-classes";
import { ViewSwitcher } from "@/components/ui/ViewSwitcher";

type Service = {
  code: string;
  name: string;
  options: string[];
  attributes: string[];
};

/**
 * Services listed for one category, with their options and attributes in source order.
 * Names already carry the source's "[Rental]" and "(optional)" markers, so nothing is added.
 * Each card opens the service's page with its (demo) listings.
 */
export function ServiceList({ services, categorySlug }: { services: Service[]; categorySlug: string }) {
  if (services.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="services-heading" className="flex flex-col gap-6">
      <div className="border-b border-line pb-4">
        <h2 id="services-heading" className="font-display text-3xl text-ink">
          Services
        </h2>
      </div>
      <ViewSwitcher summary={`${services.length} ${services.length === 1 ? "service" : "services"} · select one to see listings`}>
      <ul className={CARD_LIST_CLASS}>
        {services.map((service, i) => (
          <li
            key={service.code + service.name}
            className="reveal group relative flex flex-col gap-4 overflow-hidden rounded-sm bg-white p-6 ring-1 ring-line transition-all duration-300 hover:-translate-y-1 hover:shadow-card hover:ring-champagne"
          >
            {/* Accent line that draws across the top on hover */}
            <span
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-terracotta transition-transform duration-500 group-hover:scale-x-100"
            />
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-display text-2xl leading-tight text-ink">
                <Link
                  href={`/categories/${categorySlug}/${service.code}`}
                  className="after:absolute after:inset-0 focus-visible:outline-none"
                >
                  {service.name}
                </Link>
              </h3>
              <span aria-hidden="true" className="font-display text-sm italic text-gold transition-colors group-hover:text-terracotta">
                {String(i + 1).padStart(2, "0")}
              </span>
            </div>
            {service.options.length > 0 && (
              <ul aria-label={`${service.name} options`} className="flex flex-wrap gap-2">
                {service.options.map((option) => (
                  <li key={option} className="rounded-sm bg-sand px-3 py-1 text-sm text-ink">
                    {option}
                  </li>
                ))}
              </ul>
            )}
            {service.attributes.length > 0 && 
            (
              <p className="mt-auto border-t border-line pt-4 text-sm text-ink-soft">
                <span className="font-medium text-ink">Details:</span> {service.attributes.join(", ")}
              </p>
            )}
          </li>
        ))}
      </ul>
      </ViewSwitcher>
    </section>
  );
}
