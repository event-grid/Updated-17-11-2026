/** Editorial section title: a short rule and small-caps eyebrow above a large serif heading. */
export function SectionHeading({
  id,
  eyebrow,
  title,
  as: Tag = "h2",
}: {
  id?: string;
  eyebrow?: string;
  title: React.ReactNode;
  as?: "h1" | "h2";
}) {
  return (
    <div className="flex flex-col gap-4">
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <Tag id={id} className="font-display text-4xl font-normal leading-[1.05] tracking-tight text-ink sm:text-5xl">
        {title}
      </Tag>
    </div>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-4 text-xs font-semibold uppercase tracking-[0.22em] text-ink-soft">
      <span aria-hidden="true" className="h-px w-8 bg-terracotta" />
      {children}
    </span>
  );
}
