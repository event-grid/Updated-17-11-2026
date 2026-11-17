import Link from "next/link";
import { Suspense } from "react";

import { partnerLinks } from "@/config/partner";
import { ShowForVisitors } from "@/features/auth/show-provider-link";
import type { SectionKey } from "@/lib/site-settings";

import { BrandMark } from "./BrandMark";
import { MobileMenu } from "./MobileMenu";

type NavItem = {
  href: string;
  label: string;
  /** Hidden once a customer or provider is signed in. */
  forVisitorsOnly?: boolean;
  /** The page an administrator can switch off; the link goes with it. */
  section?: SectionKey;
};

const NAV: NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/categories", label: "Explore events" },
  { href: "/venues", label: "Venues", section: "venues" },
  { href: "/services", label: "Services", section: "services" },
  { href: "/vendors", label: "Vendors", section: "vendors" },
  { href: "/how-it-works", label: "How it works", section: "howItWorks" },
  // Providers register and sign in on their own website (provider-portal).
  ...(partnerLinks ? [{ href: partnerLinks.login, label: "For vendors", forVisitorsOnly: true }] : []),
];

const MOBILE_NAV = [...NAV, { href: "/cart", label: "Cart" }, { href: "/account", label: "My account" }];

/**
 * Site header. Slots are supplied by the app layout, because shared layout components do not import features:
 * `search` is the compact search box, `mobileSearch` its copy for the mobile menu, `cart` the cart button and
 * `account` the sign-in button or account menu. Gains a soft shadow once the page scrolls.
 */
export function SiteHeader({
  search,
  mobileSearch,
  cart,
  account,
  hiddenSections = [],
}: {
  /** Pages an administrator has switched off: their links are left out. */
  hiddenSections?: SectionKey[];
  search?: React.ReactNode;
  mobileSearch?: React.ReactNode;
  cart?: React.ReactNode;
  account?: React.ReactNode;
}) {
  return (
    <header className="header-elevate sticky top-0 z-30 border-b border-line/70 bg-cream/90 backdrop-blur-md">
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:gap-5 sm:px-8">
        <Link
          href="/"
          aria-label="EVENTGRID home"
          className="shrink-0 rounded-lg transition-transform hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-terracotta"
        >
          <BrandMark className="size-12 sm:size-14" />
        </Link>
        <nav aria-label="Main" className="hidden xl:block">
          <ul className="flex items-center gap-6 text-[15px] text-ink">
            {NAV.filter((item) => !item.section || !hiddenSections.includes(item.section)).map((item) => {
              const entry = (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="relative whitespace-nowrap py-2 transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:scale-x-0 after:bg-terracotta after:transition-transform after:duration-300 hover:text-terracotta hover:after:scale-x-100"
                  >
                    {item.label}
                  </Link>
                </li>
              );
              return item.forVisitorsOnly ? <ShowForVisitors key={item.href}>{entry}</ShowForVisitors> : entry;
            })}
          </ul>
        </nav>
        {search && <div className="hidden w-full max-w-xs md:block">{search}</div>}
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/search"
            aria-label="Search"
            className="flex size-11 items-center justify-center rounded-md text-ink ring-1 ring-line transition-colors hover:text-terracotta active:scale-95 md:hidden"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="size-5">
              <circle cx="11" cy="11" r="6.5" />
              <path d="m16 16 4.5 4.5" />
            </svg>
          </Link>
          {cart && <Suspense fallback={<div className="size-11" aria-hidden="true" />}>{cart}</Suspense>}
          {account && (
            <Suspense fallback={<div className="h-11 w-11 sm:w-28" aria-hidden="true" />}>{account}</Suspense>
          )}
          {/* The mobile menu reads the pathname, so it renders inside its own Suspense. */}
          <Suspense fallback={<div className="size-11 xl:hidden" aria-hidden="true" />}>
            <MobileMenu links={MOBILE_NAV.filter((item) => !item.section || !hiddenSections.includes(item.section))} search={mobileSearch} />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
