import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";
import { projects } from "@/data/projects";
import type { Project } from "@/types";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function findProject(slug: string): Project | undefined {
  return (projects as Project[]).find((p) => p.slug === slug);
}

/**
 * Supplies dynamic per-slug `alt` text. The static `alt` export used by
 * app/opengraph-image.tsx can't read route params, so a truly dynamic
 * alt requires generateImageMetadata — it receives the same (awaited)
 * params as the page and returns metadata objects paired to an `id`
 * that the default Image function below receives back.
 */
export async function generateImageMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = findProject(slug);

  const alt = project
    ? `${project.title} — ${siteConfig.name} Case Study`
    : `${siteConfig.name} — ${siteConfig.tagline}`;

  return [
    {
      id: "og",
      alt,
      size,
      contentType,
    },
  ];
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = findProject(slug);

  const eyebrow = project
    ? [project.category, project.client].filter(Boolean).join(" · ")
    : siteConfig.name;
  const headline = project ? project.title : siteConfig.tagline;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "80px",
        backgroundColor: "#030712",
        backgroundImage:
          "radial-gradient(circle at 15% 15%, rgba(99,102,241,0.25), transparent 55%), radial-gradient(circle at 85% 85%, rgba(6,182,212,0.2), transparent 55%)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          marginBottom: 40,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 64,
            height: 64,
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.12)",
            backgroundColor: "#111827",
            color: "#F9FAFB",
            fontSize: 26,
            fontWeight: 700,
          }}
        >
          MBR
        </div>
        <span style={{ color: "#94A3B8", fontSize: 24 }}>{eyebrow}</span>
      </div>

      <div
        style={{
          display: "flex",
          color: "#F9FAFB",
          fontSize: 56,
          fontWeight: 700,
          lineHeight: 1.15,
          maxWidth: 900,
        }}
      >
        {headline}
      </div>

      {project?.industry && (
        <div
          style={{
            display: "flex",
            marginTop: 28,
            color: "#06B6D4",
            fontSize: 22,
            fontWeight: 600,
          }}
        >
          {project.industry}
        </div>
      )}
    </div>,
    { ...size },
  );
}
