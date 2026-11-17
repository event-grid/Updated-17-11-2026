import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

import { adminLogoutAction } from "@/app/actions";
import { displayName } from "@/lib/admin-account";
import { MobileMenu } from "@/components/MobileMenu";
import { isAdmin } from "@/lib/admin-session";
import { customerSiteUrl, partnerPortalUrl } from "@/lib/site";

import { DisableContextMenu } from "@/components/DisableContextMenu";

import "./globals.css";

// The same fonts as the customer website, so the three sites look like one brand.
const heading = Playfair_Display({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const body = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: { default: "EVENTGRID Admin", template: "%s | EVENTGRID Admin" },
  robots: { index: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${heading.variable} ${body.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <DisableContextMenu />
        <header className="sticky top-0 z-30 border-b border-line/70 bg-cream/90 backdrop-blur-md">
          <div className="mx-auto flex min-h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 py-2 sm:min-h-20 sm:px-8">
            <Link href="/" aria-label="EVENTGRID Admin home" className="flex shrink-0 items-center gap-3 rounded-lg">
              <span className="inline-flex size-12 shrink-0 overflow-hidden rounded-full bg-plum ring-1 ring-champagne/40 sm:size-14">
                <Image
                  src="/images/brand/eventgrid-emblem.jpg"
                  alt="EVENTGRID"
                  width={450}
                  height={340}
                  priority
                  className="size-full object-contain p-[5%]"
                />
              </span>
              <span className="hidden text-xs font-semibold uppercase tracking-[0.25em] text-gold sm:block">Admin</span>
            </Link>
            <div className="flex items-center gap-3">
              {customerSiteUrl && (
                <a href={customerSiteUrl} className="hidden text-[15px] text-ink transition-colors hover:text-terracotta xl:block">
                  Main website
                </a>
              )}
              <Suspense fallback={<span className="h-9 w-24" aria-hidden="true" />}>
                <AdminNav />
              </Suspense>
            </div>
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-12 sm:px-8">{children}</main>

        <footer className="bg-plum text-champagne-200">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-center sm:flex-row sm:text-left sm:px-8">
            <div>
              <p className="font-display text-2xl tracking-wide text-champagne">EVENTGRID</p>
              <p className="text-xs uppercase tracking-[0.3em] text-champagne/70">Administration</p>
            </div>
            <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
              {customerSiteUrl && (
                <li>
                  <a href={customerSiteUrl} className="inline-flex min-h-11 items-center hover:text-white">
                    Main website
                  </a>
                </li>
              )}
              {partnerPortalUrl && (
                <li>
                  <a href={partnerPortalUrl} className="inline-flex min-h-11 items-center hover:text-white">
                    Vendor portal
                  </a>
                </li>
              )}
            </ul>
          </div>
          <p className="border-t border-champagne/15 px-4 py-4 text-center text-xs text-champagne/60">
            Prototype: administrator sign-in uses one account from the environment, not the EVENTGRID backend yet.
          </p>
        </footer>
      </body>
    </html>
  );
}

const NAV_LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/vendors", label: "Vendors" },
  { href: "/customers", label: "Customers" },
  { href: "/bookings", label: "Bookings" },
  { href: "/commission", label: "Commission" },
  { href: "/site", label: "Website" },
  { href: "/profile", label: "Profile" },
  { href: "/settings", label: "Settings" },
];

async function AdminNav() {
  if (!(await isAdmin())) return null;
  const name = await displayName();
  const link = "rounded-md px-3 py-2.5 text-[15px] text-ink transition-colors hover:text-terracotta";
  return (
    <>
      <nav aria-label="Admin" className="hidden flex-wrap items-center justify-end gap-1 lg:flex">
        {NAV_LINKS.slice(0, 6).map(({ href, label }) => (
          <Link key={href} href={href} className={link}>
            {label}
          </Link>
        ))}
        <span aria-hidden="true" className="mx-1 h-6 w-px bg-line" />
        <Link href="/profile" className={`${link} flex items-center gap-2`}>
          <span aria-hidden="true" className="flex size-7 items-center justify-center rounded-full bg-plum text-xs font-semibold text-champagne-200">
            {name.charAt(0).toUpperCase()}
          </span>
          Profile
        </Link>
        <Link href="/settings" className={link}>
          Settings
        </Link>
        <form action={adminLogoutAction}>
          <button type="submit" className={`${link} ring-1 ring-line`}>
            Sign out
          </button>
        </form>
      </nav>
      <MobileMenu links={NAV_LINKS} hideFrom="lg">
        <form action={adminLogoutAction}>
          <button type="submit" className="min-h-12 w-full rounded-md px-4 text-lg font-semibold text-ink ring-1 ring-line active:scale-[0.99]">
            Sign out
          </button>
        </form>
      </MobileMenu>
    </>
  );
}
