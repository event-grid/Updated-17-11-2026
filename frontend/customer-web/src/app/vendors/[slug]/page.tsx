import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { ViewSwitcher } from "@/components/ui/ViewSwitcher";
import { CARD_LIST_CLASS } from "@/components/ui/view-classes";
import { SectionGuard } from "@/components/layout/SectionGuard";
import { Eyebrow } from "@/components/layout/SectionHeading";
import { getProvider } from "@/features/marketplace/api";
import { DemoBadge } from "@/features/marketplace/components/Bits";
import { VenueCard } from "@/features/marketplace/components/Cards";
import { DummyVendorDetail } from "@/features/demo/components/DummyVendorDetail";
import { dummyVendorBySlug, parseVendorSlug } from "@/features/demo/vendors";
import { PortalProviderDetail } from "@/features/providers/components/PortalProviderDetail";
import { ListingPackages } from "@/features/marketplace/components/Packages";

export async function generateMetadata({ params }: PageProps<"/vendors/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  if (parseVendorSlug(slug)) return { title: (await dummyVendorBySlug(slug))?.vendor.name ?? "Vendor" };
  const provider = await getProvider(slug);
  return { title: provider?.provider.name ?? "Vendor" };
}

export default function ProviderPage(props: PageProps<"/vendors/[slug]">) {
  return (
    <>
      <Suspense fallback={null}>
        <SectionGuard section="vendors" />
      </Suspense>
      <ProviderPageContent {...props} />
    </>
  );
}

function ProviderPageContent(props: PageProps<"/vendors/[slug]">) {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-8">
      <Suspense fallback={<div aria-hidden="true" className="skeleton h-96 rounded-xl" />}>
        <ProviderDetail params={props.params} />
      </Suspense>
    </div>
  );
}

/** Only what the backend returns for approved providers: no private contact details or documents. */
async function ProviderDetail({ params }: Pick<PageProps<"/vendors/[slug]">, "params">) {
  const { slug } = await params;
  // Demo vendors (the placeholders listed on every service) have their own profile page.
  if (parseVendorSlug(slug)) return <DummyVendorDetail slug={slug} />;
  const detail = await getProvider(slug);
  // Not a backend provider: it may be one added in provider-portal or by an administrator (prototype data).
  if (!detail) return <PortalProviderDetail slug={slug} />;

  return (
    <article className="flex flex-col gap-14">
      <header className="flex flex-col gap-6">
        <nav aria-label="Breadcrumb" className="text-sm text-ink-soft">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/" className="hover:text-terracotta">Home</Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/services" className="hover:text-terracotta">Services</Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-ink">{detail.provider.name}</li>
          </ol>
        </nav>
        <div className="relative overflow-hidden rounded-xl bg-plum px-6 py-12 text-champagne-200 sm:px-12">
          <div aria-hidden="true" className="absolute -right-20 -top-20 size-72 animate-float rounded-full border border-champagne/20" />
          <div className="relative flex max-w-3xl flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-champagne/70">
                {detail.provider.type === "COMPANY" ? "Business" : "Individual professional"}
              </span>
              {detail.demo && <DemoBadge className="bg-champagne text-plum" />}
            </div>
            <h1 className="animate-fade-up font-display text-4xl leading-[1.05] tracking-tight text-champagne sm:text-6xl">
              {detail.provider.name}
            </h1>
            <p className="text-champagne-200/80">{[detail.area, detail.city].filter(Boolean).join(", ")}</p>
            {detail.about && <p className="max-w-2xl text-lg">{detail.about}</p>}
          </div>
        </div>
      </header>

      {detail.venues.length > 0 && (
        <section aria-labelledby="venues-heading" className="flex flex-col gap-5">
          <div className="flex items-center gap-4">
            <Eyebrow>Venues</Eyebrow>
          </div>
          <h2 id="venues-heading" className="sr-only">
            Venues
          </h2>
          <ViewSwitcher summary={`${detail.venues.length} ${detail.venues.length === 1 ? "venue" : "venues"}`}>
            <ul className={CARD_LIST_CLASS}>
              {detail.venues.map((venue) => (
                <li key={venue.slug}>
                  <VenueCard venue={venue} />
                </li>
              ))}
            </ul>
          </ViewSwitcher>
        </section>
      )}

      <section aria-labelledby="packages-heading" className="flex flex-col gap-10">
        <h2 id="packages-heading" className="font-display text-3xl text-ink">
          Packages
        </h2>
        {detail.listings.length === 0 ? (
          <p className="text-ink-soft">No packages are offered right now.</p>
        ) : (
          detail.listings.map((entry) => <ListingPackages key={entry.listing.slug} entry={entry} />)
        )}
      </section>
    </article>
  );
}
