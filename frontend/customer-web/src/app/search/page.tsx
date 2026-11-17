import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { Eyebrow } from "@/components/layout/SectionHeading";
import { searchCatalogue } from "@/features/search/api";
import { SearchForm } from "@/features/search/components/SearchForm";
import { SearchResults, SearchResultsSkeleton } from "@/features/search/components/SearchResults";
import { SEARCH_MAX_LENGTH, SEARCH_MIN_LENGTH } from "@/features/search/search-limits";

export const metadata: Metadata = {
  title: "Search",
  robots: { index: false },
};

export default function SearchPage(props: PageProps<"/search">) {
  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 py-14 sm:px-8">
      <Suspense fallback={<SearchHeader query="" />}>
        <SearchContent searchParams={props.searchParams} />
      </Suspense>
    </section>
  );
}

async function SearchContent({ searchParams }: Pick<PageProps<"/search">, "searchParams">) {
  const params = await searchParams;
  const raw = Array.isArray(params.q) ? params.q[0] : params.q;
  const query = (raw ?? "").trim().slice(0, SEARCH_MAX_LENGTH);

  return (
    <>
      <SearchHeader query={query} />
      {query.length < SEARCH_MIN_LENGTH ? (
        <SearchPrompt />
      ) : (
        <Suspense key={query} fallback={<SearchResultsSkeleton />}>
          <Results query={query} />
        </Suspense>
      )}
    </>
  );
}

async function Results({ query }: { query: string }) {
  const outcome = await searchCatalogue(query);
  if (outcome.kind === "invalid") {
    return <p className="rounded-sm bg-white p-6 text-ink-soft ring-1 ring-line">{outcome.message}</p>;
  }
  return (
    <>
      <p className="-mt-6 text-sm text-ink-soft" aria-live="polite">
        {outcome.response.total === 0
          ? "No results"
          : `${outcome.response.total} ${outcome.response.total === 1 ? "result" : "results"}`}
      </p>
      <SearchResults response={outcome.response} />
    </>
  );
}

function SearchHeader({ query }: { query: string }) {
  return (
    <div className="flex flex-col gap-6">
      <Eyebrow>Search</Eyebrow>
      <h1 className="font-display text-4xl leading-[1.05] tracking-tight text-ink sm:text-5xl">
        {query ? (
          <>
            Results for <em className="text-terracotta">“{query}”</em>
          </>
        ) : (
          <>
            Find your <em className="text-terracotta">occasion.</em>
          </>
        )}
      </h1>
      <div className="max-w-3xl">
        <SearchForm defaultValue={query} autoFocus={!query} />
      </div>
    </div>
  );
}

function SearchPrompt() {
  return (
    <p className="text-ink-soft">
      Search across every event category, event type and service — or{" "}
      <Link href="/categories" className="font-medium text-ink underline decoration-terracotta underline-offset-4 hover:text-terracotta">
        browse all categories
      </Link>
      .
    </p>
  );
}
