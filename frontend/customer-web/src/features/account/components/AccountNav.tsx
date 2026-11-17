"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useNotifications } from "@/features/shopping/hooks";

const LINKS = [
  { href: "/account", label: "Overview" },
  { href: "/account/bookings", label: "Bookings" },
  { href: "/account/favourites", label: "Favourites" },
  { href: "/account/notifications", label: "Notifications" },
  { href: "/account/profile", label: "Profile" },
];

export function AccountNav() {
  const pathname = usePathname();
  const notifications = useNotifications();
  const unread = notifications.data?.unreadCount ?? 0;

  return (
    <nav aria-label="My account" className="min-w-0 lg:sticky lg:top-28 lg:self-start">
      <ul className="flex gap-1 overflow-x-auto rounded-xl bg-white p-1.5 ring-1 ring-line [scrollbar-width:none] lg:flex-col">
        {LINKS.map((link) => {
          const active = link.href === "/account" ? pathname === "/account" : pathname?.startsWith(link.href);
          return (
            <li key={link.href} className="shrink-0">
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center justify-between gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                  active ? "bg-plum text-champagne-200" : "text-ink hover:bg-sand"
                }`}
              >
                {link.label}
                {link.href === "/account/notifications" && unread > 0 && (
                  <span className="rounded-full bg-terracotta px-2 py-0.5 text-xs font-semibold text-white">{unread}</span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
