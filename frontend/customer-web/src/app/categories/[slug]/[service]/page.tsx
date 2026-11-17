import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { CARD_LIST_CLASS } from "@/components/ui/view-classes";
import { ViewSwitcher } from "@/components/ui/ViewSwitcher";
import { getCategory } from "@/features/categories/api";
import { DummyCard } from "@/features/demo/components/DummyCard";
import { dummyListings } from "@/features/demo/dummy-listings";
import { PortalServiceCard } from "@/features/providers/components/PortalServiceCard";
import { listApprovedProviders, toPublic } from "@/lib/provider-store";

export async function generateMetadata({ params }: PageProps<"/categories/[slug]/[service]">): Promise<Metadata> {
  const { slug, service } = await params;
  const category = await getCategory(slug);
  const found = category?.services.find((s) => s.code === service);
  return { title: found ? `${found.name} · ${category?.name}` : "Service not found" };
}

export default function CategoryServicePage(props: PageProps<"/categories/[slug]/[service]">) {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-8">
      <Suspense fallback={<div aria-hidden="true" className="skeleton h-96 rounded-xl" />}>
        <ServiceListings params={props.params} />
      </Suspense>
    </div>
  );
}

async function ServiceListings({ params }: Pick<PageProps<"/categories/[slug]/[service]">, "params">) {
  const { slug, service: serviceCode } = await params;
  const category = await getCategory(slug);
  const service = category?.services.find((s) => s.code === serviceCode);
  if (!category || !service) notFound();

  // Approved providers who offer this service and have filled in its details come first (prototype data).
  await connection();
  const key = `${slug}:${service.code}`;
  const registered = (await listApprovedProviders())
    .map(toPublic)
    .flatMap((provider) =>
      provider.services.filter((s) => s.key === key && s.completed).map((s) => ({ provider, service: s })),
    );
  const listings = dummyListings(slug, service);

  return (
    <article className="flex flex-col gap-10">
      <header className="flex flex-col gap-5">
        <nav aria-label="Breadcrumb" className="text-sm text-ink-soft">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/categories" className="hover:text-terracotta">
                Categories
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href={`/categories/${slug}`} className="hover:text-terracotta">
                {category.name}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-ink">
              {service.name}
            </li>
          </ol>
        </nav>
        <h1 className="font-display text-4xl leading-[1.05] tracking-tight text-ink sm:text-5xl">{service.name}</h1>
        <p className="max-w-2xl text-ink-soft">
          Vendors for {category.name.toLowerCase()}. Registered providers appear first and update live; the demo
          placeholders show how more listings will look.
        </p>
        {service.options.length > 0 && (
          <ul aria-label={`${service.name} options`} className="flex flex-wrap gap-2">
            {service.options.map((option) => (
              <li key={option} className="rounded-sm bg-sand px-3 py-1 text-sm text-ink">
                {option}
              </li>
            ))}
          </ul>
        )}
      </header>

      <ViewSwitcher summary={`${registered.length} registered · ${listings.length} demo`}>
        <ul className={CARD_LIST_CLASS}>
          {registered.map(({ provider, service: offered }, i) => (
            <li key={provider.id} className="stagger animate-fade-up" style={{ "--i": i } as React.CSSProperties}>
              <PortalServiceCard provider={provider} service={offered} />
            </li>
          ))}
          {listings.map((listing, i) => (
            <li key={listing.id} className="stagger animate-fade-up" style={{ "--i": i } as React.CSSProperties}>
              <DummyCard listing={listing} categorySlug={slug} serviceCode={service.code} serviceName={service.name} />
            </li>
          ))}
        </ul>
      </ViewSwitcher>
    </article>
  );
}
