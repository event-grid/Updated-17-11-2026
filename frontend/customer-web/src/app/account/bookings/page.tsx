"use client";

import Link from "next/link";

import { BookingStatus } from "@/features/account/components/BookingStatus";
import { useBookings, useSignedIn } from "@/features/shopping/hooks";
import { SignInPrompt } from "@/features/shopping/components/SignInPrompt";
import { formatDate, formatRupees } from "@/lib/format";

export default function BookingsPage() {
  const { session } = useSignedIn();
  const bookings = useBookings();

  if (session.status === "loading") return <div aria-hidden="true" className="skeleton h-96 rounded-xl" />;
  if (session.status === "signed-out") return <SignInPrompt what="your bookings" />;

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-display text-4xl text-ink">Bookings</h1>
      {bookings.isLoading ? (
        <div aria-hidden="true" className="skeleton h-48 rounded-xl" />
      ) : bookings.isError ? (
        <p role="alert" className="text-terracotta-600">We could not load your bookings. Please refresh.</p>
      ) : bookings.data!.length === 0 ? (
        <p className="text-ink-soft">
          No bookings yet. Add packages to your{" "}
          <Link href="/cart" className="font-medium text-ink underline decoration-terracotta underline-offset-4">
            cart
          </Link>{" "}
          and pay the advance to book.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {bookings.data!.map((b, i) => (
            <li key={b.reference} className="stagger animate-fade-up" style={{ "--i": i } as React.CSSProperties}>
              <Link
                href={`/account/bookings/${b.reference}`}
                className="grid gap-3 rounded-xl bg-white p-5 ring-1 ring-line transition-all hover:-translate-y-0.5 hover:shadow-card sm:grid-cols-[1fr_auto]"
              >
                <span className="flex flex-col gap-1">
                  <span className="font-display text-xl text-ink">{b.title}</span>
                  <span className="text-sm text-ink-soft">
                    {b.reference} · {b.itemCount} {b.itemCount === 1 ? "item" : "items"} · event {formatDate(b.firstEventDate)}
                  </span>
                </span>
                <span className="flex flex-col items-start gap-1 sm:items-end">
                  <BookingStatus status={b.status} />
                  <span className="text-sm text-ink">{formatRupees(b.totalMinor)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
