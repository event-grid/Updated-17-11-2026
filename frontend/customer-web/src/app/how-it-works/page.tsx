import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { SectionGuard } from "@/components/layout/SectionGuard";
import { Eyebrow } from "@/components/layout/SectionHeading";
import { STEPS } from "@/features/home/how-it-works";

export const metadata: Metadata = { title: "How it works" };

export default function HowItWorksPage() {
  return (
    <>
      <Suspense fallback={null}>
        <SectionGuard section="howItWorks" />
      </Suspense>
      <HowItWorksPageContent  />
    </>
  );
}

function HowItWorksPageContent() {
  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-12 px-4 py-16 sm:px-8">
      <div className="flex animate-fade-up flex-col gap-4">
        <Eyebrow>How it works</Eyebrow>
        <h1 className="font-display text-4xl leading-[1.05] tracking-tight text-ink sm:text-6xl">
          From idea to <em className="text-terracotta">booked</em>, in five steps.
        </h1>
      </div>
      <ol className="flex flex-col">
        {STEPS.map((step, i) => (
          <li
            key={step.title}
            style={{ "--i": i } as React.CSSProperties}
            className="stagger relative flex animate-fade-up gap-5 pb-10 last:pb-0 sm:gap-8"
          >
            {/* Line down to the next step */}
            {i < STEPS.length - 1 && (
              <span aria-hidden="true" className="absolute bottom-0 left-[1.4rem] top-14 w-px bg-line sm:left-[1.9rem]" />
            )}
            <span className="relative flex size-11 shrink-0 items-center justify-center rounded-full bg-terracotta font-display text-xl text-white sm:size-14 sm:text-2xl">
              {i + 1}
            </span>
            <span className="flex flex-1 flex-col gap-2 rounded-xl bg-white p-6 ring-1 ring-line transition-all hover:-translate-y-0.5 hover:shadow-card">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-soft">
                Step {i + 1} of {STEPS.length}
              </span>
              <span className="font-display text-2xl text-ink">{step.title}</span>
              <span className="text-ink-soft">{step.body}</span>
            </span>
          </li>
        ))}
      </ol>
      <p className="text-ink-soft">
        Event dates are requests until the vendor confirms them. Cancellation and refund rules will be published on the{" "}
        <Link href="/cancellation-policy" className="font-medium text-ink underline decoration-terracotta underline-offset-4">
          cancellation information
        </Link>{" "}
        page.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link href="/venues" className="rounded-md bg-terracotta px-6 py-3.5 font-semibold text-white transition-all hover:bg-terracotta-600 active:scale-[0.98]">
          Find a venue
        </Link>
        <Link href="/services" className="rounded-md px-6 py-3.5 font-semibold text-ink ring-1 ring-line hover:text-terracotta">
          Browse services
        </Link>
      </div>
    </section>
  );
}
