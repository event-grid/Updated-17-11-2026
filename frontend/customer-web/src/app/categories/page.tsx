import type { Metadata } from "next";
import { Suspense } from "react";

import { SectionHeading } from "@/components/layout/SectionHeading";
import {
  CategoryGrid,
  CategoryGridSkeleton,
} from "@/features/categories/components/CategoryGrid";

export const metadata: Metadata = {
  title: "Event categories",
};

export default function CategoriesPage() {
  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 py-16 sm:px-8">
      <SectionHeading
        as="h1"
        eyebrow="Browse by occasion"
        title={
          <>
            Every celebration, <em className="text-terracotta">one place.</em>
          </>
        }
      />
      <Suspense fallback={<CategoryGridSkeleton />}>
        <CategoryGrid switchable />
      </Suspense>
    </section>
  );
}
