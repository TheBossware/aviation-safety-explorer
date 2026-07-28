"use client";

interface Props {
  domain: string;
  initials: string;
  color: string;
  name?: string;
  size?: number;
  className?: string;
}

/**
 * Renders a source logo as a coloured initials tile. Using a rendered
 * tile (rather than a remote favicon) guarantees the UI never shows a
 * broken image and keeps every source visually distinct via its
 * category colour.
 */
export default function SourceLogo({ initials, color, name, domain, size = 40, className = "" }: Props) {
  const dim = { width: size, height: size };
  return (
    <div
      style={dim}
      className={`flex shrink-0 items-center justify-center rounded-lg ${color} font-bold text-white ${className}`}
      aria-label={name ?? domain}
      title={name ?? domain}
    >
      <span style={{ fontSize: Math.round(size * 0.34) }}>{initials}</span>
    </div>
  );
}
