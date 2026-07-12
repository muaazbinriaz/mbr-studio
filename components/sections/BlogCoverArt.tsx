import {
  DollarSign,
  MessageCircle,
  Bot,
  Lightbulb,
  ClipboardCheck,
  Newspaper,
} from "lucide-react";

/**
 * Abstract, theme-reactive cover art for blog posts — same gradient
 * language as blog/[slug]/opengraph-image.tsx (indigo→accent radial glow)
 * but as a real component using CSS var tokens, not a flat generated PNG,
 * so it stays correct in both light and dark mode. Deliberately not a
 * stock photo — see Services page precedent (ServiceVisual.tsx).
 *
 * Picked by `category` rather than requiring a real uploaded image per
 * post — until there's a real screenshot/asset worth using for a specific
 * article, this is the default. Swap in a real <Image> per-post later by
 * checking `post.coverImage` before falling back to this.
 */
const CATEGORY_ICON: Record<string, typeof DollarSign> = {
  "Pricing & ROI": DollarSign,
  Automation: MessageCircle,
  "AI Agents": Bot,
  "Buying Guide": ClipboardCheck,
  "Founder Notes": Lightbulb,
};

export function BlogCoverArt({
  category,
  compact = false,
}: {
  category: string;
  compact?: boolean;
}) {
  const Icon = CATEGORY_ICON[category] ?? Newspaper;

  return (
    <div
      aria-hidden="true"
      className={`relative flex items-center justify-center overflow-hidden rounded-xl border border-border bg-secondary-background ${
        compact ? "h-36" : "h-56 md:h-64"
      }`}
    >
      <div
        className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-primary/20 blur-[70px]"
        style={{ background: "var(--color-primary)", opacity: 0.15 }}
      />
      <div
        className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full blur-[70px]"
        style={{ background: "var(--color-accent)", opacity: 0.12 }}
      />
      <div className="glass-card gradient-ring relative flex h-14 w-14 items-center justify-center rounded-xl">
        <Icon className="h-6 w-6 text-primary" strokeWidth={1.75} />
      </div>
    </div>
  );
}
