"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * The menu for small screens: a button that opens a full-width panel under the header, with large tap targets.
 * Closes on navigation, Escape or a tap outside. `children` (for example a sign-out form) go under the links.
 * `hideFrom` is the screen size from which the normal navigation takes over and this menu disappears.
 */
export function MobileMenu({
  links,
  hideFrom,
  children,
}: {
  links: { href: string; label: string }[];
  hideFrom: "sm" | "lg";
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [lastPath, setLastPath] = useState(pathname);
  const root = useRef<HTMLDivElement>(null);

  // Close after a navigation (adjusting state while rendering, not in an effect).
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onPointer = (e: PointerEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  return (
    <div ref={root} className={hideFrom === "sm" ? "sm:hidden" : "lg:hidden"}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-menu-panel"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((value) => !value)}
        className="flex size-11 items-center justify-center rounded-md text-ink ring-1 ring-line transition-colors hover:text-terracotta active:scale-95"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="size-5">
          {open ? <path d="m6 6 12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>
      {open && (
        <div id="mobile-menu-panel" className="absolute inset-x-0 top-full z-40 max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-line bg-cream shadow-card">
          <nav aria-label="Menu">
            <ul className="mx-auto flex max-w-6xl flex-col px-4 py-2">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={pathname === link.href ? "page" : undefined}
                    className="flex min-h-12 items-center border-b border-line/70 text-lg text-ink transition-colors last:border-b-0 hover:text-terracotta aria-[current=page]:text-terracotta"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          {children && <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 pb-4 pt-2">{children}</div>}
        </div>
      )}
    </div>
  );
}
