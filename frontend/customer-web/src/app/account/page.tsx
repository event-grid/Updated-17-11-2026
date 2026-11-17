"use client";

import Link from "next/link";

import { BookingStatus } from "@/features/account/components/BookingStatus";
import { accountLabel } from "@/features/auth/session-store";
import { useBookings, useCart, useFavourites, useNotifications, useSignedIn } from "@/features/shopping/hooks";
import { SignInPrompt } from "@/features/shopping/components/SignInPrompt";
import { formatDate, formatRupees } from "@/lib/format";

export default function AccountOverviewPage() {
  const { session } = useSignedIn();
  const bookings = useBookings();
  const cart = useCart();
  const favourites = useFavourites();
  const notifications = useNotifications();

  if (session.status === "loading") return <div aria-hidden="true" className="skeleton h-96 rounded-xl" />;
  if (session.status === "signed-out") return <SignInPrompt what="your account" />;

  const name = session.account.displayName;
  const upcoming = (bookings.data ?? []).filter((b) => b.status === "ADVANCE_PAID").slice(0, 3);
  const awaiting = (bookings.data ?? []).filter((b) => b.status === "PENDING_PAYMENT" || b.status === "PAYMENT_FAILED");

  return (
    <div className="flex flex-col gap-10">
      <header className="animate-fade-up">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ink-soft">My account</p>
        <h1 className="mt-2 font-display text-4xl text-ink sm:text-5xl">
          Welcome{name ? `, ${name}` : ""}.
        </h1>
        <p className="mt-2 text-ink-soft">Signed in as {accountLabel(session.account)}</p>
      </header>

      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat href="/cart" label="In your cart" value={cart.data?.itemCount} />
        <Stat href="/account/bookings" label="Bookings" value={bookings.data?.length} />
        <Stat href="/account/favourites" label="Favourites" value={favourites.data?.length} />
        <Stat href="/account/notifications" label="Unread notifications" value={notifications.data?.unreadCount} />
      </ul>

      {awaiting.length > 0 && (
        <section aria-labelledby="awaiting-heading" className="rounded-xl bg-tile-butter/50 p-5 ring-1 ring-gold/30">
          <h2 id="awaiting-heading" className="font-display text-2xl text-ink">
            Waiting for your payment
          </h2>
          <ul className="mt-3 flex flex-col gap-2">
            {awaiting.map((b) => (
              <li key={b.reference}>
                <Link href={`/account/bookings/${b.reference}`} className="flex flex-wrap items-center justify-between gap-2 text-sm text-ink hover:text-terracotta">
                  <span>
                    {b.reference} · {b.title}
                  </span>
                  <span className="font-semibold">Pay {formatRupees(b.advanceMinor)} →</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="upcoming-heading" className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between border-b border-line pb-3">
          <h2 id="upcoming-heading" className="font-display text-3xl text-ink">
            Upcoming bookings
          </h2>
          <Link href="/account/bookings" className="text-sm font-semibold text-terracotta">
            All bookings →
          </Link>
        </div>
        {bookings.isLoading ? (
          <div aria-hidden="true" className="skeleton h-24 rounded-xl" />
        ) : upcoming.length === 0 ? (
          <p className="text-ink-soft">
            No bookings yet.{" "}
            <Link href="/venues" className="font-medium text-ink underline decoration-terracotta underline-offset-4">
              Start with a venue
            </Link>{" "}
            or{" "}
            <Link href="/services" className="font-medium text-ink underline decoration-terracotta underline-offset-4">
              browse services
            </Link>
            .
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {upcoming.map((b) => (
              <li key={b.reference}>
                <Link
                  href={`/account/bookings/${b.reference}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4 ring-1 ring-line transition-all hover:-translate-y-0.5 hover:shadow-card"
                >
                  <span className="flex flex-col">
                    <span className="font-display text-xl text-ink">{b.title}</span>
                    <span className="text-sm text-ink-soft">
                      {b.reference} · {formatDate(b.firstEventDate)}
                    </span>
                  </span>
                  <BookingStatus status={b.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="actions-heading" className="flex flex-col gap-4">
        <h2 id="actions-heading" className="font-display text-3xl text-ink">
          Quick actions
        </h2>
        <div className="flex flex-wrap gap-3">
          {[
            ["/venues", "Find a venue"],
            ["/services", "Browse services"],
            ["/cart", "Go to cart"],
            ["/account/profile", "Edit profile"],
          ].map(([href, label]) => (
            <Link key={href} href={href} className="rounded-md px-4 py-2.5 text-sm font-semibold text-ink ring-1 ring-line transition-colors hover:text-terracotta hover:ring-terracotta/40">
              {label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ href, label, value }: { href: string; label: string; value?: number }) {
  return (
    <li>
      <Link href={href} className="flex flex-col gap-1 rounded-xl bg-white p-5 ring-1 ring-line transition-all hover:-translate-y-0.5 hover:shadow-card">
        <span className="font-display text-4xl text-ink">{value ?? "–"}</span>
        <span className="text-sm text-ink-soft">{label}</span>
      </Link>
    </li>
  );
}
