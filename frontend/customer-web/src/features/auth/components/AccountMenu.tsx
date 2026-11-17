"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

import { accountLabel, signOut, useSession } from "../session-store";

/** Header sign-in button, or the signed-in account with a sign-out menu. Sits right of the search box. */
export function AccountMenu() {
  const session = useSession();
  const pathname = usePathname();

  if (session.status !== "signed-in") {
    const href = pathname && pathname !== "/sign-in" ? `/sign-in?next=${encodeURIComponent(pathname)}` : "/sign-in";
    return (
      <Link
        href={href}
        aria-label="Sign in"
        className="inline-flex h-11 items-center gap-2 whitespace-nowrap rounded-md px-3 text-sm font-semibold text-ink ring-1 ring-line transition-all hover:text-terracotta hover:ring-terracotta/40 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta sm:px-4"
      >
        <UserGlyph className="size-5" />
        <span className="hidden sm:inline">Sign in</span>
      </Link>
    );
  }

  return <SignedInMenu label={accountLabel(session.account)} />;
}

function SignedInMenu({ label }: { label: string }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent ? event.key === "Escape" : !ref.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  async function handleSignOut() {
    setBusy(true);
    try {
      await signOut();
      setOpen(false);
      // Forget the signed-in customer's cart, bookings and favourites held in the browser.
      queryClient.clear();
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div ref={ref} className="relative animate-fade-in">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-11 items-center gap-2 rounded-md px-2 text-sm font-semibold text-ink ring-1 ring-line transition-colors hover:ring-terracotta/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta sm:pr-3"
      >
        <span aria-hidden="true" className="flex size-7 items-center justify-center rounded-full bg-plum text-champagne-200">
          <UserGlyph className="size-4" />
        </span>
        <span className="hidden max-w-36 truncate sm:inline">{label}</span>
        <span className="sr-only sm:hidden">Account</span>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-40 mt-2 w-64 origin-top-right animate-scale-in rounded-xl bg-white p-2 shadow-card ring-1 ring-line"
        >
          <p className="px-3 pb-2 pt-1 text-xs text-ink-soft">
            Signed in as
            <span className="mt-0.5 block truncate text-sm font-semibold text-ink">{label}</span>
          </p>
          {[
            ["/account", "My account"],
            ["/account/bookings", "Bookings"],
            ["/account/favourites", "Favourites"],
            ["/account/notifications", "Notifications"],
          ].map(([href, text]) => (
            <Link
              key={href}
              href={href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-sm text-ink transition-colors hover:bg-sand"
            >
              {text}
            </Link>
          ))}
          <div className="my-1 border-t border-line" />
          <button
            type="button"
            role="menuitem"
            disabled={busy}
            onClick={handleSignOut}
            className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-ink transition-colors hover:bg-sand disabled:opacity-60"
          >
            {busy ? "Signing out…" : "Sign out"}
          </button>
        </div>
      )}
    </div>
  );
}

function UserGlyph({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className={className}>
      <circle cx="12" cy="8.5" r="3.75" />
      <path d="M4.75 19.5c1.2-3.3 4-5 7.25-5s6.05 1.7 7.25 5" />
    </svg>
  );
}
