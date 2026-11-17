import Link from "next/link";
import { Suspense } from "react";

import { SectionHeading } from "@/components/layout/SectionHeading";
import { getCategories } from "@/features/categories/api";
import {
  CategoryGrid,
  CategoryGridSkeleton,
  OccasionStrip,
} from "@/features/categories/components/CategoryGrid";
import { HomeHero } from "@/features/home/components/HomeHero";
import {
  CallToAction,
  FeaturedServices,
  FeaturedVenues,
  HowItWorksStrip,
} from "@/features/home/components/HomeMarketplace";
import { PlannerBox, PlannerBoxSkeleton } from "@/features/home/components/PlannerBox";

export default function HomePage() {
  return (
    <>
      <HomeHero
        planner={
          <Suspense fallback={<PlannerBoxSkeleton />}>
            <HeroPlanner />
          </Suspense>
        }
      />
      <Suspense fallback={null}>
        <OccasionStrip />
      </Suspense>
      <section
        id="categories"
        aria-labelledby="categories-heading"
        className="mx-auto flex w-full max-w-7xl scroll-mt-24 flex-col gap-10 px-4 py-20 sm:px-8"
      >
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading id="categories-heading" eyebrow="Browse by occasion" title="What’s the occasion?" />
          <Link href="/categories" className="group inline-flex items-center gap-2 font-medium text-ink hover:text-terracotta">
            All categories
            <span aria-hidden="true" className="text-terracotta transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5">↗</span>
          </Link>
        </div>
        <Suspense fallback={<CategoryGridSkeleton />}>
          <CategoryGrid />
        </Suspense>
      </section>
      <Suspense fallback={<SectionSkeleton />}>
        <FeaturedVenues />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <FeaturedServices />
      </Suspense>
      <HowItWorksStrip />
      <CallToAction />
    </>
  );
}

function SectionSkeleton() {
  return (
    <div aria-hidden="true" className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-20 sm:grid-cols-2 sm:px-8 lg:grid-cols-4">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="skeleton h-72 rounded-xl" />
      ))}
    </div>
  );
}

async function HeroPlanner() {
  const categories = await getCategories();
  return <PlannerBox categories={categories} />;
}
