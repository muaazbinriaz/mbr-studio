// Mirrors the CSS custom properties defined in app/globals.css.
// Use Tailwind utility classes (bg-primary, text-foreground, etc.) wherever
// possible; reach for these raw values only where a JS-level color is
// required (canvas, SVG gradients, chart libraries).

export const colors = {
  background: "#030712",
  backgroundSecondary: "#0F172A",
  card: "#111827",
  primary: "#6366F1",
  accent: "#06B6D4",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  text: "#F9FAFB",
  secondaryText: "#94A3B8",
  border: "rgba(255,255,255,.08)",
} as const;

export type ColorToken = keyof typeof colors;
