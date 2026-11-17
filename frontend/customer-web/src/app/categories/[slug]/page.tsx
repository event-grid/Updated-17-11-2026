import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { getCategories, getCategory } from "@/features/categories/api";
import { CategoryHeader } from "@/features/categories/components/CategoryHeader";
import { EventTypeList } from "@/features/event-types/components/EventTypeList";
import { ServiceList } from "@/features/services/components/ServiceList";

/** All 12 categories are prerendered; with Cache Components this must return at least one entry. */
export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/categories/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);
  return { title: category?.name ?? "Category not found" };
}

export default function CategoryPage(props: PageProps<"/categories/[slug]">) {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-8">
      <Suspense fallback={<CategoryDetailSkeleton />}>
        <CategoryDetail params={props.params} />
      </Suspense>
    </div>
  );
}

async function CategoryDetail({
  params,
}: Pick<PageProps<"/categories/[slug]">, "params">) {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) {
    notFound();
  }

  const hasContent =
    category.eventTypes.length > 0 ||
    category.subcategories.length > 0 ||
    category.services.length > 0;

  return (
    <article className="flex flex-col gap-14">
      <CategoryHeader slug={category.slug} name={category.name} />
      <EventTypeList title="Event types" items={category.eventTypes} />
      <EventTypeList title="Subcategories" items={category.subcategories} />
      <ServiceList services={category.services} categorySlug={category.slug} />
      {!hasContent && (
        <p className="rounded-sm border border-dashed border-line bg-white p-10 text-center font-display text-xl italic text-ink-soft">
          No event types or services are listed for this category yet.
        </p>
      )}
    </article>
  );
}

function CategoryDetailSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-14">
      <div className="h-72 skeleton rounded-sm" />
      <div className="h-24 skeleton rounded-sm" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="h-40 skeleton rounded-sm" />
        <div className="h-40 skeleton rounded-sm" />
        <div className="h-40 skeleton rounded-sm" />
      </div>
    </div>
  );
}
