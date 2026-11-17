"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { useShowProviderLink } from "@/features/auth/show-provider-link";

/**
 * Menu for screens narrower than the desktop navigation: a panel that slides in from the right with the
 * search box and the main links. Closes on navigation, Escape, or a tap outside; the page behind stops scrolling.
 */
export function MobileMenu({
  links,
  search,
}: {
  links: { href: string; label: string; forVisitorsOnly?: boolean }[];
  search?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const showVisitorLinks = useShowProviderLink();
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const [lastPath, setLastPath] = useState(pathname);

  // Close after a navigation (adjusting state during render, not in an effect).
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>("input, a")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [open]);

  return (
    <div className="xl:hidden">
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen((value) => !value)}
        className="flex size-11 items-center justify-center rounded-md text-ink ring-1 ring-line transition-colors hover:text-terracotta active:scale-95"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="size-5">
          <path d="M4 7h16M4 12h16M4 17h10" />
        </svg>
      </button>

      {/*
        Rendered into <body>: the header's backdrop blur makes it the containing block for fixed children,
        which would trap the panel inside the 80px header.
      */}
      {open && createPortal(
        <div className="fixed inset-0 z-50 xl:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button
            type="button"
            aria-label="Close menu"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="absolute inset-0 animate-fade-in bg-plum/40 backdrop-blur-sm"
          />
          <div
            id="mobile-menu"
            ref={panelRef}
            className="absolute inset-y-0 right-0 flex w-[min(22rem,88vw)] animate-[slide-in_0.35s_var(--ease-out-soft)_backwards] flex-col gap-8 overflow-y-auto bg-cream p-6 shadow-card"
          >
            <div className="flex items-center justify-between">
              <span className="font-display text-2xl text-ink">Menu</span>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="flex size-10 items-center justify-center rounded-md text-ink ring-1 ring-line transition-colors hover:text-terracotta"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="size-5">
                  <path d="m6 6 12 12M18 6 6 18" />
                </svg>
              </button>
            </div>
            {search && <div>{search}</div>}
            <nav aria-label="Main">
              <ul className="flex flex-col">
                {links.filter((link) => showVisitorLinks || !link.forVisitorsOnly).map((link, i) => (
                  <li key={link.href} className="stagger animate-fade-up" style={{ "--i": i + 1 } as React.CSSProperties}>
                    <Link
                      href={link.href}
                      aria-current={pathname === link.href ? "page" : undefined}
                      className="flex items-center justify-between border-b border-line py-4 font-display text-2xl text-ink transition-colors hover:text-terracotta aria-[current=page]:text-terracotta"
                    >
                      {link.label}
                      <span aria-hidden="true" className="text-base text-terracotta">↗</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <p className="mt-auto text-xs uppercase tracking-[0.3em] text-ink-soft">One platform, every celebration</p>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
