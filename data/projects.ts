/**
 * TODO (content): each project below is a REAL, shipped project — only
 * the case-study write-up sub-fields (`problem`, `solution`, `outcome`)
 * are sometimes incomplete.
 *
 * QA FIX (manual test pass): the case-study detail page's "results are
 * being finalized" fallback only fires when `outcome` is an EMPTY array.
 * This file previously had `outcome` populated with bracketed
 * placeholder text like "[e.g. 40%]" / "[e.g. increase in booking
 * inquiries]" — which meant the fallback never triggered, and 3 live
 * case-study pages were rendering that literal placeholder text to
 * visitors as if it were real data. Fixed by setting `outcome: []` for
 * any project without real numbers yet, so the honest fallback message
 * shows instead.
 *
 * Replace `outcome: []` with real metric objects (and the `problem`/
 * `solution` TODOs with real copy) as case studies get written up — do
 * NOT invent plausible-sounding metrics or narrative to fill these
 * fields early. A fabricated stat on a real client's case study is a
 * false claim, not a placeholder.
 *
 * HONESTY PASS: `client` no longer names a business as if it were a
 * paying client for any project below — all three are personal /
 * self-initiated builds used to demonstrate skill, and now carry
 * `badge: "Personal Project"` so this is visible on the card itself,
 * not just in this comment. The real subject of each project (e.g. the
 * Lumière Skin Clinic concept) still lives in `title` and `summary` —
 * nothing about the work itself is hidden, only the implied client
 * relationship is corrected.
 */
import type { Project } from "@/types";
import type { BusinessType } from "@/lib/chat/estimator";

export const projects: Project[] = [
  {
    slug: "lumiere-skin-clinic",
    title: "Lumière Skin Clinic Website",
    client: "Personal Project",
    industry: "Healthcare / Aesthetic Clinic (concept build)",
    badge: "Personal Project",
    summary:
      "A full-stack web application built as a self-initiated concept for a skin clinic, delivering a complete digital presence with AI chatbot, online booking, and admin dashboard. Built with Next.js, TypeScript, and MongoDB.",
    image: "/images/projects/skin-clinic/skin-clinic.png",
    images: [
      "/images/projects/skin-clinic/skin-clinic-services.png",
      "/images/projects/skin-clinic/skin-clinic-blog.png",
      "/images/projects/skin-clinic/skin-clinic-footer.png",
    ],
    tags: [
      "Next.js",
      "TypeScript",
      "TailwindCSS",
      "MongoDB",
      "NextAuth",
      "Cloudinary",
      "AI Chatbot",
    ],
    category: "AI Chatbot",
    link: "https://lumeiri-skin-clinic.vercel.app/",
    problem:
      "Clinics like this typically need a professional online presence that can handle appointment bookings and answer common patient questions without adding to staff workload — I built this to prove out that exact workflow end to end.",
    solution:
      "Built a full-stack site with an integrated AI chatbot for FAQs and lead capture, an online booking flow, and an admin dashboard for staff to manage bookings and content — on Next.js, TypeScript, and MongoDB.",
    outcome: [],
  },

  {
    slug: "jobmatch-ai-job-matching",
    title: "JobMatch — AI-Powered CV Analysis & Job Matching",
    client: "Personal Project",
    industry: "Startup / SaaS",
    badge: "Personal Project",
    summary:
      "An AI-powered job matching platform where users upload their CV as a PDF and get matched against live job listings. The app extracts skills, experience, and education using an LLM, then searches real-time job data to surface relevant openings — all behind secure email/password authentication.",
    image: "/images/projects/jobmatch/hero.png",
    images: [
      "/images/projects/jobmatch/login.png",
      "/images/projects/jobmatch/mobile.png",
    ],
    tags: [
      "Next.js",
      "React",
      "NextAuth.js",
      "TailwindCSS",
      "Node.js",
      "Express",
      "MongoDB",
      "Mongoose",
      "JWT",
      "Groq (Llama 3.1)",
      "pdf-parse",
      "JSearch API",
    ],
    category: "Website",
    link: "https://job-hunt-frontend-green.vercel.app/",
    problem:
      "Job seekers spend hours manually reading their CV against dozens of listings to figure out which roles are actually a fit — a slow, repetitive process that misses relevant openings buried in irrelevant search results.",
    solution:
      "Built an end-to-end pipeline: users upload a PDF CV, the backend extracts raw text with pdf-parse, and Groq's Llama 3.1 8B model structures it into skills, experience, and education. That profile is matched against live listings pulled from JSearch (RapidAPI), with results cached for 24 hours per user to minimize API costs.",
    outcome: [],
  },

  {
    slug: "mern-trello-task-board",
    title: "MERN Trello-Style Collaborative Task Board",
    client: "Personal Project",
    industry: "Startup / SaaS",
    badge: "Personal Project",
    summary:
      "A full-stack collaborative Kanban board app inspired by Trello. Users create boards, invite teammates by email, and manage drag-and-drop lists and cards with real-time updates powered by WebSockets — complete with image uploads, tagging, and automation rules.",
    image: "/images/projects/task-board/hero.png",
    images: [
      "/images/projects/task-board/workflow.png",
      "/images/projects/task-board/card-modal.png",
      "/images/projects/task-board/invitation-modal.png",
      "/images/projects/task-board/automation-modal.png",
    ],
    tags: [
      "React 19",
      "Redux Toolkit",
      "TailwindCSS",
      "Vite",
      "React DnD",
      "Socket.IO",
      "Node.js",
      "Express",
      "MongoDB",
      "Mongoose",
      "JWT",
      "Cloudinary",
      "Nodemailer",
    ],
    category: "SaaS",
    link: "https://notes-frontend-rouge.vercel.app/",
    problem:
      "Teams often juggle scattered task lists across chat threads and spreadsheets, with no shared, real-time view of who's doing what — leading to duplicated work and missed updates when multiple people edit the same board.",
    solution:
      "Built a real-time collaborative Kanban board where every list, card, and member change syncs instantly across all connected users via WebSockets (Socket.IO). Added automation rules — like auto-moving cards to a new list when tagged — plus email invitations, image attachments, and drag-and-drop reordering for a smooth, Trello-like workflow.",
    outcome: [],
  },
];

/**
 * BUGFIX: this used to compare `project.industry.toLowerCase()` (free
 * text like "Healthcare / Aesthetic Clinic") for strict equality against
 * `category`, which is a BusinessType enum value (e.g. "healthcare").
 * "healthcare / aesthetic clinic" !== "healthcare", so matchCategory was
 * false for every real project whenever a category was supplied — the
 * AI's searchPortfolio tool would silently return zero results any time
 * the model passed a category, even when a matching project existed.
 * Fixed by matching each BusinessType against keywords that can appear
 * inside the free-text `industry` field instead of requiring equality.
 */
const CATEGORY_KEYWORDS: Record<BusinessType, string[]> = {
  restaurant: ["restaurant", "food", "cafe"],
  retail: ["retail", "e-commerce", "ecommerce", "shop"],
  services: ["services", "agency"],
  real_estate: ["real estate", "property"],
  healthcare: ["healthcare", "clinic", "medical"],
  startup_saas: ["startup", "saas"],
  other: [],
};

export function searchProjects(
  category?: BusinessType,
  keyword?: string,
): Project[] {
  // Simple in-memory search – replace with real data when you add more projects.
  return projects.filter((project) => {
    const industryLower = project.industry.toLowerCase();
    const matchCategory =
      !category ||
      category === "other" ||
      CATEGORY_KEYWORDS[category].some((kw) => industryLower.includes(kw));
    const matchKeyword =
      !keyword ||
      project.title.toLowerCase().includes(keyword.toLowerCase()) ||
      project.summary.toLowerCase().includes(keyword.toLowerCase());
    return matchCategory && matchKeyword;
  });
}
