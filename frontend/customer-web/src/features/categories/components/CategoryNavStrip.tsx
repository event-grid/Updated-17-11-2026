"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { CategoryIcon } from "@/components/icons/CategoryIcon";
import { categoryPresentation } from "@/config/category-presentation";

import type { CategorySummary } from "../types";

/**
 * Icon-and-label strip of every event category, shown under the header on every page except the home page
 * (the home page has its own category tiles) and the account pages (profile, bookings and so on). The current category is highlighted. Scrolls sideways on
 * narrow screens.
 */
export function CategoryNavStrip({ categories }: { categories: CategorySummary[] }) {
  const pathname = usePathname();
  const activeRef = useRef<HTMLAnchorElement>(null);

  // Keep the highlighted category in view on narrow screens.
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [pathname]);

  // Not on the home page (it has its own category tiles) and not in the signed-in account area.
  if (pathname === "/" || pathname === "/account" || pathname?.startsWith("/account/")) {
    return null;
  }

  const items = [
    { href: "/categories", label: "All", active: pathname === "/categories", icon: <AllIcon />, tileBg: "bg-champagne-200" },
    ...categories.map((c) => {
      const p = categoryPresentation(c.slug);
      const href = `/categories/${c.slug}`;
      return {
        href,
        label: c.name,
        active: pathname === href,
        icon: <CategoryIcon name={p.icon} className={`size-6 ${p.tile.icon}`} />,
        tileBg: p.tile.bg,
      };
    }),
  ];

  return (
    <nav aria-label="Event categories" className="animate-fade-in border-b border-line/70 bg-white">
      <ul className="mx-auto flex w-full max-w-7xl gap-1 overflow-x-auto px-2 py-2.5 [scrollbar-width:none] sm:px-6 lg:justify-between [&::-webkit-scrollbar]:hidden">
        {items.map((item) => (
          <li key={item.href} className="shrink-0">
            <Link
              ref={item.active ? activeRef : undefined}
              href={item.href}
              aria-current={item.active ? "page" : undefined}
              title={item.label}
              className="group flex w-[5.9rem] flex-col items-center gap-1.5 rounded-lg px-1 py-1.5 transition-colors hover:bg-sand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-plum"
            >
              <span
                aria-hidden="true"
                className={`flex size-11 items-center justify-center rounded-xl transition-all duration-300 group-hover:-translate-y-0.5 group-hover:scale-105 group-active:scale-95 ${item.tileBg} ${
                  item.active ? "ring-2 ring-terracotta ring-offset-2" : ""
                }`}
              >
                {item.icon}
              </span>
              {/* Two lines, so long names ("Weddings and Reception") stay readable instead of being cut. */}
              <span
                className={`line-clamp-2 min-h-[2lh] w-full text-center text-[12px] leading-tight ${
                  item.active ? "font-semibold text-ink" : "text-ink-soft group-hover:text-ink"
                }`}
              >
                {item.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function AllIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-6 text-gold">
      <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" />
    </svg>
  );
}
