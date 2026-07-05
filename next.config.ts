import type { NextConfig } from "next";

/**
 * PERFORMANCE PASS (Prompt 21): optimizePackageImports forces Next to
 * only bundle the specific icons actually imported from lucide-react
 * per client component, instead of risking the whole icon set getting
 * pulled into a client chunk. lucide-react is imported in nearly every
 * client component in this project (Navbar, ChatWindow, Hero islands,
 * ProjectCard, PortfolioGrid, Testimonials), so this has broad reach.
 */
const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  serverExternalPackages: ["@xenova/transformers"],
};

export default nextConfig;
