import Link from "next/link";
import { ArrowLeft, ArrowRight, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";

type ButtonSize = "xs" | "sm" | "default";

/**
 * Standard in-app navigation: "Back to …" and "Details" are real buttons, never plain text links,
 * so it is obvious where to click. See "Navigation buttons" in AGENTS.md.
 */
export function BackButton({ href, children, size = "sm" }: { href: string; children: React.ReactNode; size?: ButtonSize }) {
  return (
    <Button size={size} className="w-fit" nativeButton={false} render={<Link href={href} />}>
      <ArrowLeft data-icon="inline-start" />
      {children}
    </Button>
  );
}

/**
 * Link to another site (source article, original post). Outlined so it reads as secondary to the
 * page's own navigation, with an external-link icon; always opens in a new tab.
 */
export function ExternalButton({ href, children, size = "sm" }: { href: string; children: React.ReactNode; size?: ButtonSize }) {
  return (
    <Button
      variant="outline"
      size={size}
      nativeButton={false}
      render={<a href={href} target="_blank" rel="noopener noreferrer" />}
    >
      {children}
      <ExternalLink data-icon="inline-end" />
    </Button>
  );
}

export function DetailsButton({
  href,
  children = "Details",
  size = "sm",
}: {
  href: string;
  children?: React.ReactNode;
  size?: ButtonSize;
}) {
  return (
    <Button size={size} nativeButton={false} render={<Link href={href} />}>
      {children}
      <ArrowRight data-icon="inline-end" />
    </Button>
  );
}
