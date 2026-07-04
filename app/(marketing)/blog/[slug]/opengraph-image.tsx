import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";
import { blogPosts, type BlogPost } from "@/data/blog";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Only published posts get their own OG image — an unpublished post
 * (still holding placeholder content, per blog.ts's convention) falls
 * back to the generic site image rather than surfacing draft copy or
 * crashing the build.
 */
function findPost(slug: string): BlogPost | undefined {
  const post = blogPosts.find((p) => p.slug === slug);
  return post?.published ? post : undefined;
}

export async function generateImageMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = findPost(slug);

  const alt = post
    ? `${post.title} — ${siteConfig.name} Blog`
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
  const post = findPost(slug);

  const eyebrow = post ? post.category : siteConfig.name;
  const headline = post ? post.title : siteConfig.tagline;

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
    </div>,
    { ...size },
  );
}
