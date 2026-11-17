/**
 * Marks the parts of `text` that start with one of the search `words` (the backend matches words
 * by prefix, so "wed" highlights the start of "Weddings"). Case-insensitive; works for any script.
 */
export function Highlight({ text, words }: { text: string; words: string[] }) {
  if (words.length === 0) {
    return <>{text}</>;
  }

  const alternatives = [...words]
    .sort((a, b) => b.length - a.length)
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
  const pattern = new RegExp(`(?<![\\p{L}\\p{M}\\p{N}])(${alternatives})`, "giu");
  const parts = text.split(pattern);

  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <mark key={i} className="rounded-sm bg-champagne/70 px-0.5 text-ink">
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}

/** True if any word of `text` starts with one of the search words. */
export function matchesAny(text: string, words: string[]) {
  const lower = text.toLocaleLowerCase();
  return words.some((w) =>
    lower.split(/[^\p{L}\p{M}\p{N}]+/u).some((token) => token.startsWith(w)),
  );
}
