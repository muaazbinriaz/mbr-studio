import type { Project } from "@/types";

export type ProjectCategory =
  | "restaurant"
  | "retail"
  | "services"
  | "real_estate"
  | "healthcare"
  | "startup_saas"
  | "other";

export const projects: Project[] = [
  {
    slug: "test-project",
    title: "Restaurant Website",
    client: "Test Client",
    industry: "Restaurant",
    summary: "A modern website built for a local restaurant.",
    image: "",
    tags: ["Next.js", "Tailwind", "SEO"],
    category: "Website",
  },
];

export function searchProjects(
  category?: ProjectCategory,
  keyword?: string,
): Project[] {
  // Simple in-memory search – replace with real data when you add more projects.
  return projects.filter((project) => {
    const matchCategory =
      !category || project.industry.toLowerCase() === category;
    const matchKeyword =
      !keyword ||
      project.title.toLowerCase().includes(keyword.toLowerCase()) ||
      project.summary.toLowerCase().includes(keyword.toLowerCase());
    return matchCategory && matchKeyword;
  });
}
