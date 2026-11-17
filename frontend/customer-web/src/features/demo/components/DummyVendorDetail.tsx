import Link from "next/link";
import { notFound } from "next/navigation";

import { DemoBadge, Price } from "@/features/marketplace/components/Bits";
import { formatRupees } from "@/lib/format";

import { dummyVendorBySlug } from "../vendors";

/** Profile page of a demo vendor (provider): who they are, the service they offer and its packages. Not bookable. */
export async function DummyVendorDetail({ slug }: { slug: string }) {
  const found = await dummyVendorBySlug(slug);
  if (!found) notFound();
  const { vendor, listing, options } = found;
  const unit = vendor.priceUnit === "PER_GUEST" ? " per guest" : "";

  return (
    <article className="flex flex-col gap-12">
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
              {vendor.name}
            </li>
          </ol>
        </nav>
        <div className="relative overflow-hidden rounded-xl bg-plum px-6 py-10 text-champagne-200 sm:px-12 sm:py-12">
          <div aria-hidden="true" className="absolute -right-20 -top-20 size-72 animate-float rounded-full border border-champagne/20" />
          <div className="relative flex max-w-3xl flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-champagne/70">Vendor · {vendor.categoryName}</span>
              <DemoBadge className="bg-champagne text-plum" />
            </div>
            <h1 className="animate-fade-up font-display text-3xl leading-[1.05] tracking-tight text-champagne sm:text-6xl">{vendor.name}</h1>
            <p className="text-champagne-200/80">
              {vendor.area}, {vendor.city}
            </p>
            <p className="text-champagne-200/80">
              <span aria-hidden="true" className="text-champagne">
                ★
              </span>{" "}
              {vendor.rating.toFixed(1)} · {vendor.reviewCount} reviews
            </p>
          </div>
        </div>
      </header>

      <div className="grid gap-12 lg:grid-cols-[1fr_20rem]">
        <div className="flex flex-col gap-12">
          <section aria-labelledby="about-heading" className="flex flex-col gap-4">
            <h2 id="about-heading" className="font-display text-3xl text-ink">
              About
            </h2>
            <p className="text-ink-soft">{listing.about}</p>
          </section>

          <section aria-labelledby="service-heading" className="flex flex-col gap-4">
            <h2 id="service-heading" className="font-display text-3xl text-ink">
              Service offered
            </h2>
            <div className="flex flex-col gap-3 rounded-xl bg-white p-6 ring-1 ring-line">
              <h3 className="font-display text-2xl text-ink">{vendor.serviceName}</h3>
              <ul className="flex flex-wrap gap-2">
                {[...new Set([...options, ...listing.highlights])].map((h) => (
                  <li key={h} className="rounded-sm bg-sand px-3 py-1 text-sm text-ink">
                    {h}
                  </li>
                ))}
              </ul>
              <p>
                <Link
                  href={`/categories/${vendor.categorySlug}/${vendor.serviceCode}/${vendor.listingId}`}
                  className="text-sm font-medium text-ink underline decoration-terracotta underline-offset-4"
                >
                  See this vendor’s listing
                </Link>
              </p>
            </div>
          </section>

          <section aria-labelledby="packages-heading" className="flex flex-col gap-6">
            <h2 id="packages-heading" className="font-display text-3xl text-ink">
              Packages
            </h2>
            <ul className="grid gap-4 sm:grid-cols-3">
              {listing.packages.map((pkg) => (
                <li key={pkg.name} className="flex flex-col gap-4 rounded-xl bg-white p-5 ring-1 ring-line">
                  <h3 className="font-display text-xl text-ink">{pkg.name}</h3>
                  <p className="text-sm text-ink-soft">
                    <strong className="font-display text-2xl font-semibold text-ink">{formatRupees(pkg.priceMinor)}</strong>
                    {unit}
                  </p>
                  <ul className="flex flex-col gap-1.5 text-sm text-ink">
                    {pkg.includes.map((line) => (
                      <li key={line} className="flex gap-2">
                        <span aria-hidden="true" className="text-terracotta">
                          ✓
                        </span>
                        {line}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="flex h-fit flex-col gap-4 rounded-xl bg-white p-6 ring-1 ring-line lg:sticky lg:top-28">
          <Price minor={vendor.fromPriceMinor} unit={vendor.priceUnit} from />
          <p className="text-sm text-ink-soft">
            This is a demo vendor, so it cannot be booked. Real vendors with bookable packages are on the services page.
          </p>
          <Link
            href={`/services?category=${vendor.categorySlug}`}
            className="rounded-md bg-terracotta px-5 py-3 text-center font-semibold text-white transition-all hover:bg-terracotta-600 active:scale-[0.98]"
          >
            See bookable services
          </Link>
        </aside>
      </div>
    </article>
  );
}
