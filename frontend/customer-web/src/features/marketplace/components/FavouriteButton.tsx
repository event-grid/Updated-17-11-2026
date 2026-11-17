"use client";

import { useRouter } from "next/navigation";

import { useFavourites, useSignedIn, useToggleFavourite } from "@/features/shopping/hooks";

/** Sign-in link back to the current page (read at click time, so the button needs no route data to render). */
export function signInHere() {
  return `/sign-in?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
}

/** Heart toggle for a venue or listing. Signed-out visitors are sent to sign in and come back here. */
export function FavouriteButton({ type, slug, name, className = "" }: { type: "venue" | "listing"; slug: string; name: string; className?: string }) {
  const { session, signedIn } = useSignedIn();
  const router = useRouter();
  const favourites = useFavourites();
  const toggle = useToggleFavourite();

  const saved =
    favourites.data?.some((f) => f.slug === slug && f.type === (type === "venue" ? "VENUE" : "LISTING")) ?? false;
  const optimistic = toggle.isPending ? !toggle.variables?.saved : saved;

  const base = `inline-flex size-10 items-center justify-center rounded-full bg-white/90 shadow-sm ring-1 ring-line backdrop-blur transition-all hover:scale-110 active:scale-95 ${className}`;

  if (session.status !== "signed-in") {
    return (
      <button
        type="button"
        onClick={() => router.push(signInHere())}
        aria-label={`Sign in to save ${name}`}
        title="Sign in to save"
        className={base}
      >
        <Heart filled={false} />
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-pressed={optimistic}
      aria-label={optimistic ? `Remove ${name} from favourites` : `Save ${name} to favourites`}
      disabled={!signedIn || toggle.isPending || favourites.isLoading}
      onClick={() => toggle.mutate({ type, slug, saved })}
      className={base}
    >
      <Heart filled={optimistic} />
    </button>
  );
}

function Heart({ filled }: { filled: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      className={`size-5 transition-colors ${filled ? "animate-[pop-in_0.35s_var(--ease-out-soft)] text-terracotta" : "text-ink"}`}
    >
      <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" strokeLinejoin="round" />
    </svg>
  );
}
