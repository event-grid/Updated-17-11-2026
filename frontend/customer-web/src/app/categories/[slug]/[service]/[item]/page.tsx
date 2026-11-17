import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { getCategory } from "@/features/categories/api";
import { dummyListing } from "@/features/demo/dummy-listings";
import { vendorSlug } from "@/features/demo/vendors";
import { DemoBadge, Price } from "@/features/marketplace/components/Bits";
import { formatRupees } from "@/lib/format";

export async function generateMetadata({ params }: PageProps<"/categories/[slug]/[service]/[item]">): Promise<Metadata> {
  const { slug, service, item } = await params;
  const category = await getCategory(slug);
  const found = category?.services.find((s) => s.code === service);
  const listing = found ? dummyListing(slug, found, item) : null;
  return { title: listing?.title ?? "Listing not found" };
}

export default function DummyListingPage(props: PageProps<"/categories/[slug]/[service]/[item]">) {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-8">
      <Suspense fallback={<div aria-hidden="true" className="skeleton h-96 rounded-xl" />}>
        <DummyListingDetail params={props.params} />
      </Suspense>
    </div>
  );
}

async function DummyListingDetail({ params }: Pick<PageProps<"/categories/[slug]/[service]/[item]">, "params">) {
  const { slug, service: serviceCode, item } = await params;
  const category = await getCategory(slug);
  const service = category?.services.find((s) => s.code === serviceCode);
  const listing = service ? dummyListing(slug, service, item) : null;
  if (!category || !service || !listing) notFound();

  const unit = listing.priceUnit === "PER_GUEST" ? " per guest" : "";

  return (
    <article className="flex flex-col gap-12">
      <header className="flex flex-col gap-6">
        <nav aria-label="Breadcrumb" className="text-sm text-ink-soft">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href={`/categories/${slug}`} className="hover:text-terracotta">
                {category.name}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href={`/categories/${slug}/${service.code}`} className="hover:text-terracotta">
                {service.name}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-ink">
              {listing.title}
            </li>
          </ol>
        </nav>
        <div className="relative overflow-hidden rounded-xl bg-plum px-6 py-12 text-champagne-200 sm:px-12">
          <div aria-hidden="true" className="absolute -right-20 -top-20 size-72 animate-float rounded-full border border-champagne/20" />
          <div className="relative flex max-w-3xl flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-champagne/70">{service.name}</span>
              <DemoBadge className="bg-champagne text-plum" />
            </div>
            <h1 className="animate-fade-up font-display text-4xl leading-[1.05] tracking-tight text-champagne sm:text-6xl">
              {listing.title}
            </h1>
            <p className="text-champagne-200/80">
              <Link href={`/vendors/${vendorSlug(slug, service.code, listing.id)}`} className="underline decoration-champagne/50 underline-offset-4 hover:text-white">
                {listing.providerName}
              </Link>{" "}
              · {listing.area}, {listing.city}
            </p>
            <p className="text-champagne-200/80">
              <span aria-hidden="true" className="text-champagne">
                ★
              </span>{" "}
              {listing.rating.toFixed(1)} · {listing.reviewCount} reviews
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
            <ul className="flex flex-wrap gap-2">
              {listing.highlights.map((h) => (
                <li key={h} className="rounded-sm bg-sand px-3 py-1 text-sm text-ink">
                  {h}
                </li>
              ))}
            </ul>
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
          <Price minor={listing.fromPriceMinor} unit={listing.priceUnit} from />
          <p className="text-sm text-ink-soft">
            This is a demo listing, so it cannot be booked. Real vendors with bookable packages are on the services page.
          </p>
          <Link
            href={`/services?category=${slug}`}
            className="rounded-md bg-terracotta px-5 py-3 text-center font-semibold text-white transition-all hover:bg-terracotta-600 active:scale-[0.98]"
          >
            See bookable services
          </Link>
        </aside>
      </div>
    </article>
  );
}
