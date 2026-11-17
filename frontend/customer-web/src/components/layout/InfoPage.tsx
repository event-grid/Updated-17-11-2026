import { Eyebrow } from "./SectionHeading";

/** Simple content page (about, help, legal). `pending` marks text that waits for the owner's approved wording. */
export function InfoPage({
  eyebrow,
  title,
  pending,
  children,
}: {
  eyebrow: string;
  title: React.ReactNode;
  pending?: string;
  children: React.ReactNode;
}) {
  return (
    <article className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-16 sm:px-8">
      <div className="flex animate-fade-up flex-col gap-4">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="font-display text-4xl leading-[1.05] tracking-tight text-ink sm:text-5xl">{title}</h1>
      </div>
      {pending && (
        <p role="note" className="rounded-lg bg-tile-butter/60 px-4 py-3 text-sm text-ink ring-1 ring-gold/30">
          {pending}
        </p>
      )}
      <div className="flex flex-col gap-5 text-lg leading-relaxed text-ink-soft [&_h2]:mt-4 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:text-ink [&_strong]:text-ink">
        {children}
      </div>
    </article>
  );
}
