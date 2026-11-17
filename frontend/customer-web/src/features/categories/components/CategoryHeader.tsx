import Link from "next/link";

import { CategoryIcon } from "@/components/icons/CategoryIcon";
import { Eyebrow } from "@/components/layout/SectionHeading";
import { categoryPresentation } from "@/config/category-presentation";

/** Category page banner in the category's tile colour, with breadcrumb, name, tagline and icon. */
export function CategoryHeader({ slug, name }: { slug: string; name: string }) {
  const { tile, icon, tagline } = categoryPresentation(slug);

  return (
    <header className="flex flex-col gap-8">
      <nav aria-label="Breadcrumb" className="text-sm text-ink-soft">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href="/" className="hover:text-terracotta">Home</Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/categories" className="hover:text-terracotta">Event categories</Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-ink">{name}</li>
        </ol>
      </nav>
      <div className={`relative animate-[fade-in_0.6s_ease-out_backwards] overflow-hidden rounded-sm px-6 py-12 sm:px-12 sm:py-16 ${tile.bg}`}>
        <div
          aria-hidden="true"
          className="absolute -right-6 -top-6 animate-[pop-in_1.1s_var(--ease-out-soft)_0.15s_backwards] sm:right-8 sm:top-1/2 sm:-translate-y-1/2"
        >
          <CategoryIcon name={icon} className={`size-56 animate-float opacity-25 sm:size-64 ${tile.icon}`} />
        </div>
        <div className="relative flex max-w-2xl flex-col gap-5">
          <div className="stagger animate-fade-up" style={{ "--i": 1 } as React.CSSProperties}>
            <Eyebrow>Event category</Eyebrow>
          </div>
          <h1
            style={{ "--i": 2 } as React.CSSProperties}
            className="stagger animate-fade-up font-display text-4xl font-normal leading-[1.05] tracking-tight text-ink sm:text-6xl"
          >
            {name}
          </h1>
          <p style={{ "--i": 3 } as React.CSSProperties} className="stagger animate-fade-up font-display text-2xl italic text-terracotta-600">
            {tagline}
          </p>
        </div>
      </div>
    </header>
  );
}
