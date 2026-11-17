"use client";

import Link from "next/link";

import { DemoBadge, Price } from "@/features/marketplace/components/Bits";
import { FavouriteButton } from "@/features/marketplace/components/FavouriteButton";
import { useFavourites, useSignedIn } from "@/features/shopping/hooks";
import { SignInPrompt } from "@/features/shopping/components/SignInPrompt";

export default function FavouritesPage() {
  const { session } = useSignedIn();
  const favourites = useFavourites();

  if (session.status === "loading") return <div aria-hidden="true" className="skeleton h-96 rounded-xl" />;
  if (session.status === "signed-out") return <SignInPrompt what="your favourites" />;

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-display text-4xl text-ink">Favourites</h1>
      {favourites.isLoading ? (
        <div aria-hidden="true" className="skeleton h-48 rounded-xl" />
      ) : favourites.isError ? (
        <p role="alert" className="text-terracotta-600">We could not load your favourites. Please refresh.</p>
      ) : favourites.data!.length === 0 ? (
        <p className="text-ink-soft">
          Tap the heart on a venue or service to save it here.{" "}
          <Link href="/venues" className="font-medium text-ink underline decoration-terracotta underline-offset-4">
            Browse venues
          </Link>
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {favourites.data!.map((f, i) => {
            const type = f.type === "VENUE" ? "venue" : "listing";
            return (
              <li
                key={`${f.type}:${f.slug}`}
                style={{ "--i": i } as React.CSSProperties}
                className="stagger relative flex animate-fade-up flex-col gap-2 rounded-xl bg-white p-5 ring-1 ring-line transition-shadow hover:shadow-card"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-soft">{f.type === "VENUE" ? "Venue" : "Service"}</p>
                    <h2 className="font-display text-xl text-ink">
                      <Link
                        href={type === "venue" ? `/venues/${f.slug}` : `/vendors/${f.providerSlug}#${f.slug}`}
                        className="hover:text-terracotta"
                      >
                        {f.title}
                      </Link>
                    </h2>
                  </div>
                  <FavouriteButton type={type} slug={f.slug} name={f.title} />
                </div>
                <p className="text-sm text-ink-soft">
                  {f.subtitle} · {f.city}
                </p>
                <div className="flex items-center justify-between">
                  <Price minor={f.fromPriceMinor} unit={f.priceUnit} from />
                  {f.demo && <DemoBadge />}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
