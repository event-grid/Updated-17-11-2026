import Link from "next/link";

import { Eyebrow } from "@/components/layout/SectionHeading";

export default function NotFound() {
  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col items-start gap-6 px-4 py-24 sm:px-8">
      <Eyebrow>Page not found</Eyebrow>
      <h1 className="font-display text-5xl leading-tight text-ink sm:text-6xl">
        This celebration <em className="text-terracotta">isn&apos;t here.</em>
      </h1>
      <p className="text-lg text-ink-soft">We couldn&apos;t find what you were looking for.</p>
      <Link
        href="/categories"
        className="inline-flex items-center gap-2 rounded-md bg-plum px-6 py-3.5 font-semibold text-champagne-200 transition-colors hover:bg-plum-700"
      >
        Browse event categories <span aria-hidden="true">⟶</span>
      </Link>
    </section>
  );
}
