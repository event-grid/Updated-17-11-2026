import Link from "next/link";

import { adminLoginUrl, partnerLinks } from "@/config/partner";
import type { SectionKey } from "@/lib/site-settings";

type FooterLink = { href: string; label: string; section?: SectionKey };

const EXPLORE: FooterLink[] = [
  { href: "/categories", label: "All event categories" },
  { href: "/venues", label: "Venues", section: "venues" },
  { href: "/services", label: "Services", section: "services" },
  { href: "/vendors", label: "Vendors", section: "vendors" },
  { href: "/search", label: "Search" },
];

const COMPANY: FooterLink[] = [
  { href: "/about", label: "About EVENTGRID" },
  { href: "/how-it-works", label: "How it works", section: "howItWorks" },
  { href: "/support", label: "Customer support" },
  { href: "/contact", label: "Contact" },
];

/** Providers register and sign in on their own website (provider-portal). */
const PROVIDERS = partnerLinks
  ? [
      { href: partnerLinks.register, label: "Register as a vendor" },
      { href: partnerLinks.login, label: "Vendor sign in" },
    ]
  : [];

const LEGAL = [
  { href: "/terms", label: "Terms and conditions" },
  { href: "/privacy", label: "Privacy policy" },
  { href: "/cancellation-policy", label: "Cancellation information" },
];

/**
 * Read once when the server starts (module scope), not during rendering: with Cache Components, reading
 * the current time while rendering would make every page dynamic. Refreshed by each deploy.
 */
const year = new Date().getFullYear();

/** Quick searches; each returns results from the current catalogue. */
const POPULAR_SEARCHES = ["Venue", "Photography", "Catering", "Decoration", "Makeup", "Mehandi", "DJ", "Tent"];

/**
 * Site footer: link columns, a brand row and a bottom band (structure as in large marketplace footers).
 * `categoryColumns` (the catalogue's category links) is supplied by the app layout, because shared layout
 * components do not depend on features. `social` is the row of social buttons (set by an administrator).
 */
export function SiteFooter({
  categoryColumns,
  social,
  hiddenSections = [],
}: {
  categoryColumns?: React.ReactNode;
  social?: React.ReactNode;
  /** Pages an administrator has switched off: their links are left out. */
  hiddenSections?: SectionKey[];
}) {
  const visible = (links: FooterLink[]) => links.filter((link) => !link.section || !hiddenSections.includes(link.section));
  return (
    <footer className="mt-auto text-champagne-200">
      {/* Back to top */}
      <a
        href="#top"
        className="group block bg-plum-700 py-3.5 text-center text-sm font-medium text-champagne-200 transition-colors hover:bg-plum-500 hover:text-white"
      >
        Back to top{" "}
        <span aria-hidden="true" className="inline-block transition-transform duration-300 group-hover:-translate-y-1">
          ↑
        </span>
      </a>

      {/* Link columns */}
      <div className="bg-plum">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-2 gap-x-6 gap-y-10 px-4 py-12 sm:gap-x-8 sm:px-8 sm:py-14 lg:grid-cols-3 lg:gap-y-12 xl:grid-cols-6">
          <FooterColumn title="EVENTGRID" links={visible(COMPANY)} />
          <FooterColumn title="Explore" links={visible(EXPLORE)} />
          {PROVIDERS.length > 0 && <FooterColumn title="For vendors" links={PROVIDERS} />}

          {categoryColumns}

          <FooterColumn
            title="Popular searches"
            links={POPULAR_SEARCHES.map((q) => ({ href: `/search?q=${encodeURIComponent(q.toLowerCase())}`, label: q }))}
          />
        </div>

        {/* Brand row */}
        <div className="border-t border-champagne/15">
          <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 px-4 py-7 text-center sm:flex-row sm:px-8 sm:text-left">
            <p className="font-display text-2xl tracking-wide text-champagne">EVENTGRID</p>
            {social}
            <p className="text-xs uppercase tracking-[0.3em] text-champagne/70">One platform, every celebration</p>
          </div>
        </div>
      </div>

      {/* Bottom band */}
      <div className="bg-[#170316]">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-champagne/60 sm:flex-row sm:px-8">
          <p>© {year} EVENTGRID. All rights reserved.</p>
          <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {LEGAL.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-champagne-200">
                  {link.label}
                </Link>
              </li>
            ))}
            {adminLoginUrl && (
              <li>
                <a href={adminLoginUrl} className="hover:text-champagne-200">
                  Admin
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <nav aria-label={title} className="flex flex-col gap-4">
      <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-champagne/60">{title}</h2>
      <ul className="flex flex-col gap-2.5 text-sm">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="inline-block text-champagne-200 transition-all duration-200 hover:translate-x-1 hover:text-white">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
