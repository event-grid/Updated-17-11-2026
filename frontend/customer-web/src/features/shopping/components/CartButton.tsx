"use client";

import Link from "next/link";

import { useCart } from "../hooks";

/** Header cart icon with the number of items (signed-in customers only have a cart). */
export function CartButton() {
  const cart = useCart();
  const count = cart.data?.itemCount ?? 0;
  return (
    <Link
      href="/cart"
      aria-label={count > 0 ? `Cart, ${count} ${count === 1 ? "item" : "items"}` : "Cart"}
      className="relative flex size-11 items-center justify-center rounded-md text-ink ring-1 ring-line transition-all hover:text-terracotta active:scale-95"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-5">
        <path d="M4 5h2l2 10h10l2-7H7" />
        <circle cx="10" cy="19" r="1.3" />
        <circle cx="17" cy="19" r="1.3" />
      </svg>
      {count > 0 && (
        <span
          key={count}
          className="absolute -right-1.5 -top-1.5 flex min-w-5 animate-[pop-in_0.4s_var(--ease-out-soft)] items-center justify-center rounded-full bg-terracotta px-1 text-[11px] font-semibold text-white"
        >
          {count}
        </span>
      )}
    </Link>
  );
}
