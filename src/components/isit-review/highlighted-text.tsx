/**
 * Matches a quote in the text the way the validator does: same words in the same order, anything
 * that is not a letter or digit in between (punctuation, whitespace, broken-encoding characters).
 */
function quotePattern(part: string): RegExp | null {
  const words = part.normalize("NFKC").split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  if (!words.length || words.join("").length < 3) return null;
  return new RegExp(`(?<![\\p{L}\\p{N}])${words.join("[^\\p{L}\\p{N}]+")}(?![\\p{L}\\p{N}])`, "giu");
}

/** Renders `text` with every evidence quote highlighted, so a reviewer can check it in context. */
export function HighlightedText({ text, quotes, inline = false }: { text: string; quotes: string[]; inline?: boolean }) {
  const ranges: Array<[number, number]> = [];
  for (const quote of quotes) {
    for (const part of quote.split(/\.\.\.|…/)) {
      const pattern = quotePattern(part);
      if (!pattern) continue;
      for (const match of text.matchAll(pattern)) {
        ranges.push([match.index, match.index + match[0].length]);
      }
    }
  }
  ranges.sort((a, b) => a[0] - b[0]);

  const merged: Array<[number, number]> = [];
  for (const range of ranges) {
    const last = merged.at(-1);
    if (last && range[0] <= last[1]) last[1] = Math.max(last[1], range[1]);
    else merged.push([...range]);
  }

  const pieces: React.ReactNode[] = [];
  let cursor = 0;
  merged.forEach(([start, end], index) => {
    if (start > cursor) pieces.push(text.slice(cursor, start));
    pieces.push(
      <mark key={index} className="rounded-sm bg-primary/15 px-0.5 text-foreground">
        {text.slice(start, end)}
      </mark>
    );
    cursor = end;
  });
  if (cursor < text.length) pieces.push(text.slice(cursor));

  if (inline) return <span>{pieces}</span>;
  return <div className="text-sm leading-6 whitespace-pre-line text-foreground">{pieces}</div>;
}
