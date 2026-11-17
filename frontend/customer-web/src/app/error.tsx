"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";

export default function ErrorPage({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col items-start gap-6 px-4 py-24 sm:px-8">
      <span className="flex items-center gap-4 text-xs font-semibold uppercase tracking-[0.22em] text-ink-soft">
        <span aria-hidden="true" className="h-px w-8 bg-terracotta" />
        Something went wrong
      </span>
      <h1 className="font-display text-5xl leading-tight text-ink sm:text-6xl">
        This page <em className="text-terracotta">couldn&apos;t load.</em>
      </h1>
      <p className="text-lg text-ink-soft">Please try again in a moment.</p>
      <button
        type="button"
        onClick={() => retry()}
        className="inline-flex items-center gap-2 rounded-md bg-plum px-6 py-3.5 font-semibold text-champagne-200 transition-colors hover:bg-plum-700"
      >
        Try again <span aria-hidden="true">⟶</span>
      </button>
    </section>
  );
}
