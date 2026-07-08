import { cn } from "@/lib/utils";

/**
 * MBR Studio logomark — Step 1 rebrand.
 *
 * Minimal geometric "M" built from two converging strokes inside a
 * rounded-square container, filled with the brand gradient (primary →
 * accent). Uses CSS custom properties directly so it's automatically
 * theme-reactive (no separate light/dark SVG needed) and scales cleanly
 * from favicon size up to large hero use.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={cn("h-8 w-8 shrink-0", className)}
    >
      <defs>
        <linearGradient
          id="mbr-logo-gradient"
          x1="0"
          y1="0"
          x2="32"
          y2="32"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="var(--color-primary)" />
          <stop offset="1" stopColor="var(--color-accent)" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#mbr-logo-gradient)" />
      <path
        d="M8 22V10l8 7 8-7v12"
        stroke="var(--color-primary-foreground)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Full lockup (mark + wordmark). Use this anywhere the current text-only
 * wordmark (`{siteConfig.name}`) was rendered — Navbar, Footer, mobile
 * drawer header, etc.
 */
export function Logo({
  className,
  markClassName,
  showWordmark = true,
}: {
  className?: string;
  markClassName?: string;
  showWordmark?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark className={markClassName} />
      {showWordmark && (
        <span className="font-heading text-lg font-semibold tracking-tight">
          MBR Studio
        </span>
      )}
    </span>
  );
}
