import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

import { SessionNav } from "@/components/SessionNav";
import { customerSiteUrl } from "@/lib/site";

import { DisableContextMenu } from "@/components/DisableContextMenu";

import "./globals.css";

// The same fonts as the customer website, so the two sites look like one brand.
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
  title: { default: "EVENTGRID Partners", template: "%s | EVENTGRID Partners" },
  description: "Register and manage your services on EVENTGRID.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${heading.variable} ${body.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <DisableContextMenu />
        <header className="sticky top-0 z-30 border-b border-line/70 bg-cream/90 backdrop-blur-md">
          <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:h-20 sm:gap-4 sm:px-8">
            <Link href="/" aria-label="EVENTGRID Partners home" className="flex shrink-0 items-center gap-3 rounded-lg">
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
              <span className="hidden text-xs font-semibold uppercase tracking-[0.25em] text-gold sm:block">Partners</span>
            </Link>
            <div className="flex items-center gap-4">
              {customerSiteUrl && (
                <a href={customerSiteUrl} className="hidden text-[15px] text-ink transition-colors hover:text-terracotta sm:block">
                  Back to EVENTGRID
                </a>
              )}
              <Suspense fallback={<span className="h-9 w-24" aria-hidden="true" />}>
                <SessionNav />
              </Suspense>
            </div>
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-12 sm:px-8">{children}</main>

        <footer className="bg-plum text-champagne-200">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-center sm:flex-row sm:px-8 sm:text-left">
            <div>
              <p className="font-display text-2xl tracking-wide text-champagne">EVENTGRID</p>
              <p className="text-xs uppercase tracking-[0.3em] text-champagne/70">One platform, every celebration</p>
            </div>
            <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
              {customerSiteUrl && (
                <li>
                  <a href={customerSiteUrl} className="inline-flex min-h-11 items-center hover:text-white">
                    Main website
                  </a>
                </li>
              )}
              <li>
                <Link href="/register" className="inline-flex min-h-11 items-center hover:text-white">
                  Register
                </Link>
              </li>
              <li>
                <Link href="/login" className="inline-flex min-h-11 items-center hover:text-white">
                  Sign in
                </Link>
              </li>
            </ul>
          </div>
          <p className="border-t border-champagne/15 px-4 py-4 text-center text-xs text-champagne/60">
            Prototype: vendor accounts are kept in a local development file, not in the EVENTGRID backend yet.
          </p>
        </footer>
      </body>
    </html>
  );
}
