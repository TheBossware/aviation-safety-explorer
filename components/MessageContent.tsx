"use client";

import React from "react";

/** Inline bold (**text**) parser -> React nodes. */
function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) {
      return (
        <strong key={`${keyPrefix}-b-${i}`} className="font-semibold text-slate-900">
          {p.slice(2, -2)}
        </strong>
      );
    }
    return <React.Fragment key={`${keyPrefix}-t-${i}`}>{p}</React.Fragment>;
  });
}

/**
 * Minimal, resilient markdown renderer supporting headings, bold,
 * bullet/numbered lists and GitHub-style tables. Tolerates partial
 * input so it can be used during streaming.
 */
export default function MessageContent({ text }: { text: string }) {
  const lines = text.split("\n");
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Table: a line with | followed by a separator row (---)
    if (/\|/.test(line) && i + 1 < lines.length && /^\s*\|?[\s:|-]+\|?\s*$/.test(lines[i + 1]) && /-/.test(lines[i + 1])) {
      const header = line.split("|").map((c) => c.trim()).filter((c) => c.length > 0);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && /\|/.test(lines[i])) {
        rows.push(lines[i].split("|").map((c) => c.trim()).filter((c) => c.length > 0));
        i += 1;
      }
      blocks.push(
        <div key={key++} className="my-3 overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                {header.map((h, hi) => (
                  <th key={hi} className="border border-gray-200 bg-gray-50 px-3 py-2 text-left font-semibold text-slate-700">
                    {renderInline(h, `th-${hi}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => (
                <tr key={ri}>
                  {r.map((c, ci) => (
                    <td key={ci} className="border border-gray-200 px-3 py-2 text-slate-600">
                      {renderInline(c, `td-${ri}-${ci}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // Headings
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      const level = h[1].length;
      const cls =
        level <= 2
          ? "mt-3 mb-1.5 text-sm font-bold text-slate-900"
          : "mt-2 mb-1 text-[13px] font-semibold text-slate-800";
      blocks.push(<p key={key++} className={cls}>{renderInline(h[2], `h-${key}`)}</p>);
      i += 1;
      continue;
    }

    // Bullet list
    if (/^\s*[-*]\s+/.test(line)) {
      const listItems: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        listItems.push(lines[i].replace(/^\s*[-*]\s+/, ""));
        i += 1;
      }
      blocks.push(
        <ul key={key++} className="my-2 list-disc space-y-1 pl-5 text-[13px] leading-relaxed text-slate-700">
          {listItems.map((li, li2) => (
            <li key={li2}>{renderInline(li, `li-${key}-${li2}`)}</li>
          ))}
        </ul>
      );
      continue;
    }

    // Numbered list
    if (/^\s*\d+\.\s+/.test(line)) {
      const listItems: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        listItems.push(lines[i].replace(/^\s*\d+\.\s+/, ""));
        i += 1;
      }
      blocks.push(
        <ol key={key++} className="my-2 list-decimal space-y-1 pl-5 text-[13px] leading-relaxed text-slate-700">
          {listItems.map((li, li2) => (
            <li key={li2}>{renderInline(li, `ol-${key}-${li2}`)}</li>
          ))}
        </ol>
      );
      continue;
    }

    // Blank line
    if (line.trim() === "") {
      i += 1;
      continue;
    }

    // Paragraph
    blocks.push(
      <p key={key++} className="my-1.5 text-[13px] leading-relaxed text-slate-700">
        {renderInline(line, `p-${key}`)}
      </p>
    );
    i += 1;
  }

  return <div>{blocks}</div>;
}
