import Link from "next/link";

/** Previous / next links for a paged list. `href(page)` builds the address and keeps the other filters. */
export function Pager({ page, size, total, href }: { page: number; size: number; total: number; href: (page: number) => string }) {
  const pages = Math.max(1, Math.ceil(total / size));
  if (pages <= 1) return null;
  const link = "rounded-md px-4 py-2 text-sm font-semibold text-ink ring-1 ring-line hover:text-terracotta";
  return (
    <nav aria-label="Pages" className="flex items-center justify-center gap-3">
      {page > 1 && (
        <Link href={href(page - 1)} className={link}>
          ← Previous
        </Link>
      )}
      <span className="px-2 text-sm text-ink-soft">
        Page {page} of {pages}
      </span>
      {page < pages && (
        <Link href={href(page + 1)} className={link}>
          Next →
        </Link>
      )}
    </nav>
  );
}
