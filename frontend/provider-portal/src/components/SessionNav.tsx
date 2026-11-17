import Link from "next/link";

import { logoutAction } from "@/app/actions";
import { currentProvider } from "@/lib/session";
import { customerSiteUrl } from "@/lib/site";

import { MobileMenu } from "./MobileMenu";

/** Header links: Sign in / Register when signed out, Dashboard / Profile / Settings / Sign out when signed in. */
export async function SessionNav() {
  const provider = await currentProvider();
  const link = "rounded-md px-3 py-2.5 text-[15px] text-ink transition-colors hover:text-terracotta";

  if (!provider) {
    return (
      <nav aria-label="Account" className="flex items-center gap-2">
        <Link href="/login" className={link}>
          Sign in
        </Link>
        <Link href="/register" className="rounded-md bg-terracotta px-4 py-2.5 text-[15px] font-semibold text-white transition-colors hover:bg-terracotta-600">
          Register
        </Link>
      </nav>
    );
  }

  const links = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/profile", label: "Profile" },
    { href: "/settings", label: "Settings" },
  ];
  return (
    <>
      <nav aria-label="Account" className="hidden items-center gap-2 sm:flex">
        {links.map(({ href, label }) => (
          <Link key={href} href={href} className={link}>
            {label}
          </Link>
        ))}
        <form action={logoutAction}>
          <button type="submit" className={`${link} ring-1 ring-line`}>
            Sign out
          </button>
        </form>
      </nav>
      <MobileMenu links={links} hideFrom="sm">
        {customerSiteUrl && (
          <a href={customerSiteUrl} className="flex min-h-12 items-center text-lg text-ink">
            Back to EVENTGRID
          </a>
        )}
        <form action={logoutAction}>
          <button type="submit" className="min-h-12 w-full rounded-md px-4 text-lg font-semibold text-ink ring-1 ring-line active:scale-[0.99]">
            Sign out
          </button>
        </form>
      </MobileMenu>
    </>
  );
}
