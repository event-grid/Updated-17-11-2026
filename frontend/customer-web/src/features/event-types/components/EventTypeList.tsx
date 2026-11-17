type Entry = { code: string; name: string };

/**
 * Event types (source "Sub Types") or subcategories of a category, shown as written in the source.
 * Selecting one does not filter anything yet: whether Sub Types change the services shown is D-08.
 */
export function EventTypeList({
  title,
  items,
}: {
  title: string;
  items: Entry[];
}) {
  if (items.length === 0) {
    return null;
  }

  const headingId = `${title.toLowerCase().replace(/\s+/g, "-")}-heading`;

  return (
    <section aria-labelledby={headingId} className="reveal flex flex-col gap-5">
      <h2 id={headingId} className="border-b border-line pb-4 font-display text-3xl text-ink">
        {title}
      </h2>
      <ul className="flex flex-wrap gap-2.5">
        {items.map((item, i) => (
          <li
            key={item.code}
            style={{ "--i": i } as React.CSSProperties}
            className="stagger animate-fade-up cursor-default rounded-sm bg-sand px-4 py-2 text-[15px] text-ink ring-1 ring-line transition-all hover:-translate-y-0.5 hover:bg-white hover:ring-champagne"
          >
            {item.name}
          </li>
        ))}
      </ul>
    </section>
  );
}
