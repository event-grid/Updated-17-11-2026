import Link from "next/link";

import { categoryPresentation } from "@/config/category-presentation";

import { getCategories } from "../api";

/**
 * Footer columns listing every event category from the catalogue: main categories and other occasions.
 * Rendered inside the site footer; cached with the catalogue.
 */
export async function FooterCategoryColumns() {
  const categories = await getCategories();
  const featured = categories.filter((c) => categoryPresentation(c.slug).group === "featured");
  const other = categories.filter((c) => categoryPresentation(c.slug).group === "other");

  return (
    <>
      <FooterColumn title="Celebrations" links={featured.map((c) => ({ href: `/categories/${c.slug}`, label: c.name }))} />
      <FooterColumn title="More occasions" links={other.map((c) => ({ href: `/categories/${c.slug}`, label: c.name }))} />
    </>
  );
}

export function FooterCategoryColumnsSkeleton() {
  return (
    <>
      {[8, 4].map((rows, i) => (
        <div key={i} aria-hidden="true" className="flex flex-col gap-3">
          <div className="h-3 w-24 rounded bg-champagne/15" />
          {Array.from({ length: rows }, (_, j) => (
            <div key={j} className="h-3 w-32 rounded bg-champagne/10" />
          ))}
        </div>
      ))}
    </>
  );
}

function FooterColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  if (links.length === 0) return null;
  return (
    <nav aria-label={title} className="flex flex-col gap-4">
      <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-champagne/60">{title}</h2>
      <ul className="flex flex-col gap-2.5 text-sm">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="text-champagne-200 transition-colors hover:text-white">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
