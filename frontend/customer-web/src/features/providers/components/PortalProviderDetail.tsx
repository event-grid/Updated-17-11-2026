import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { DemoBadge } from "@/features/marketplace/components/Bits";
import { formatRupees } from "@/lib/format";
import { getApprovedProviderBySlug, toPublic } from "@/lib/provider-store";

/**
 * Public page of a provider that registered in provider-portal or was added by an administrator (prototype
 * data, see lib/provider-store.ts). Shows only what the provider filled in; these services cannot be booked yet.
 */
export async function PortalProviderDetail({ slug }: { slug: string }) {
  await connection();
  const stored = await getApprovedProviderBySlug(slug);
  if (!stored) notFound();
  const provider = toPublic(stored);
  const completed = provider.services.filter((s) => s.completed);

  return (
    <article className="flex flex-col gap-14">
      <header className="flex flex-col gap-6">
        <nav aria-label="Breadcrumb" className="text-sm text-ink-soft">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/vendors" className="hover:text-terracotta">
                Vendors
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-ink">
              {provider.name}
            </li>
          </ol>
        </nav>
        <div className="relative overflow-hidden rounded-xl bg-plum px-6 py-12 text-champagne-200 sm:px-12">
          <div aria-hidden="true" className="absolute -right-20 -top-20 size-72 animate-float rounded-full border border-champagne/20" />
          <div className="relative flex max-w-3xl flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-champagne/70">
                {provider.type === "COMPANY" ? "Business" : "Individual professional"}
              </span>
              <DemoBadge className="bg-champagne text-plum" />
            </div>
            <h1 className="animate-fade-up font-display text-4xl leading-[1.05] tracking-tight text-champagne sm:text-6xl">{provider.name}</h1>
            <p className="text-champagne-200/80">{[provider.area, provider.city].filter(Boolean).join(", ")}</p>
            {provider.about && <p className="max-w-2xl text-lg">{provider.about}</p>}
          </div>
        </div>
      </header>

      <section aria-labelledby="services-heading" className="flex flex-col gap-6">
        <h2 id="services-heading" className="font-display text-3xl text-ink">
          Services
        </h2>
        {completed.length === 0 ? (
          <p className="text-ink-soft">This vendor has not published any service details yet.</p>
        ) : (
          <ul className="grid gap-5 md:grid-cols-2">
            {completed.map((s) => (
              <li key={s.key} className="flex flex-col gap-3 rounded-xl bg-white p-6 ring-1 ring-line">
                <div>
                  <h3 className="font-display text-2xl text-ink">{s.serviceName}</h3>
                  <p className="text-xs text-ink-soft">{s.categoryName}</p>
                </div>
                {s.startingPriceRupees != null && (
                  <p className="text-sm text-ink-soft">
                    From <strong className="font-display text-xl text-ink">{formatRupees(s.startingPriceRupees * 100)}</strong>
                    {s.priceUnit === "PER_GUEST" ? " per guest" : ""}
                  </p>
                )}
                <p className="text-sm text-ink">{s.description}</p>
                {(s.options.length > 0 || Object.keys(s.attributes).length > 0) && (
                  <ul className="flex flex-wrap gap-2">
                    {s.options.map((o) => (
                      <li key={o} className="rounded-sm bg-sand px-3 py-1 text-sm text-ink">
                        {o}
                      </li>
                    ))}
                    {Object.entries(s.attributes).map(([k, v]) => (
                      <li key={k} className="rounded-sm bg-sand px-3 py-1 text-sm text-ink">
                        {k}: {v}
                      </li>
                    ))}
                  </ul>
                )}
                {s.packages.length > 0 && (
                  <ul className="mt-1 flex flex-col gap-2 border-t border-line pt-3 text-sm">
                    {s.packages.map((p) => (
                      <li key={p.name} className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="text-ink">
                          {p.name}
                          {p.description && <span className="text-ink-soft"> · {p.description}</span>}
                        </span>
                        <strong className="font-display text-lg text-ink">{formatRupees(p.priceRupees * 100)}</strong>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
        <p className="text-sm text-ink-soft">These packages are shown for information and cannot be booked online yet.</p>
      </section>
    </article>
  );
}
