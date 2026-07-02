// Blueprint Part 1, Section 3 — Responsive Breakpoints
export const breakpoints = {
  xs: 320,
  sm: 375,
  md: 425,
  tablet: 768,
  laptop: 1024,
  desktop: 1280,
  wide: 1536,
} as const;

export type Breakpoint = keyof typeof breakpoints;
