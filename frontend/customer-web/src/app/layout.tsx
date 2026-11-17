import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";

import { DisableContextMenu } from "@/components/DisableContextMenu";
import { LiveSync } from "@/components/LiveSync";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { ConfiguredFooter, ConfiguredHeader } from "@/components/layout/ConfiguredChrome";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { AccountMenu } from "@/features/auth/components/AccountMenu";
import { CartButton } from "@/features/shopping/components/CartButton";
import { QueryProvider } from "@/providers/QueryProvider";
import { CategoryNav } from "@/features/categories/components/CategoryNav";
import {
  FooterCategoryColumns,
  FooterCategoryColumnsSkeleton,
} from "@/features/categories/components/FooterCategoryColumns";
import { SearchForm } from "@/features/search/components/SearchForm";
import { SocialLinks } from "@/features/site/components/SocialLinks";
import { Suspense } from "react";

import "./globals.css";

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
  title: {
    default: "EVENTGRID — One platform, every celebration",
    template: "%s | EVENTGRID",
  },
  description:
    "Find venues and event vendors for weddings, parties, gatherings and more.",
};

// Built once so the header and footer fallbacks and the configured versions share the same slots.
const headerSlots = {
  search: <SearchForm compact />,
  mobileSearch: <SearchForm compact inputId="mobile-search" />,
  cart: <CartButton />,
  account: <AccountMenu />,
};

const footerSlots = {
  social: (
    <Suspense fallback={null}>
      <SocialLinks />
    </Suspense>
  ),
  categoryColumns: (
    <Suspense fallback={<FooterCategoryColumnsSkeleton />}>
      <FooterCategoryColumns />
    </Suspense>
  ),
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${heading.variable} ${body.variable} h-full antialiased`}
    >
      <body id="top" className="flex min-h-full flex-col font-sans">
        <DisableContextMenu />
        <QueryProvider>
        <Suspense fallback={null}>
          <LiveSync />
        </Suspense>
        <Suspense fallback={null}>
          <AnnouncementBar />
        </Suspense>
        {/* The same header and footer twice: the plain one while the administrator's page switches load. */}
        <Suspense fallback={<SiteHeader {...headerSlots} />}>
          <ConfiguredHeader {...headerSlots} />
        </Suspense>
        {/* Category strip on every page except home (the strip hides itself there). */}
        <Suspense fallback={null}>
          <CategoryNav />
        </Suspense>
        <main className="flex w-full flex-1 flex-col">{children}</main>
        <Suspense fallback={<SiteFooter {...footerSlots} />}>
          <ConfiguredFooter {...footerSlots} />
        </Suspense>
        </QueryProvider>
      </body>
    </html>
  );
}
