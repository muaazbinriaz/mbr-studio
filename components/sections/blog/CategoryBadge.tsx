import { getCategoryStyle } from "@/lib/blog";

/**
 * Solid variant sits on top of photos (dark scrim underneath), soft variant
 * is used anywhere the badge sits directly on the page background — e.g.
 * filter chips, article meta rows.
 */
export function CategoryBadge({
  category,
  variant = "solid",
  className = "",
}: {
  category: string;
  variant?: "solid" | "soft";
  className?: string;
}) {
  if (variant === "solid") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1 text-xs font-medium text-white backdrop-blur-md ${className}`}
      >
        {category}
      </span>
    );
  }

  const style = getCategoryStyle(category);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${style.bg} ${style.text} ${style.ring} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {category}
    </span>
  );
}
