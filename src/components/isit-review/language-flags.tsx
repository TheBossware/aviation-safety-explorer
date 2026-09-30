import { cn } from "@/lib/utils";

// Inline SVG instead of flag emoji: Windows renders 🇬🇧/🇹🇷 as plain letters. National flag colours
// are fixed by definition, so they are hardcoded rather than theme tokens.

export function UkFlag({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 30" className={cn("h-4 w-8 shrink-0 rounded-[2px] ring-1 ring-foreground/10", className)} aria-hidden>
      <clipPath id="uk-flag-diagonals">
        <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
      </clipPath>
      <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
      <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#uk-flag-diagonals)" stroke="#C8102E" strokeWidth="4" />
      <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
      <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
    </svg>
  );
}

export function TurkeyFlag({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 1200 800" className={cn("h-4 w-6 shrink-0 rounded-[2px] ring-1 ring-foreground/10", className)} aria-hidden>
      <rect width="1200" height="800" fill="#E30A17" />
      <circle cx="425" cy="400" r="200" fill="#fff" />
      <circle cx="475" cy="400" r="160" fill="#E30A17" />
      <polygon
        fill="#fff"
        points="583.334,400 764.235,458.779 652.431,304.894 652.431,495.106 764.235,341.221"
      />
    </svg>
  );
}
