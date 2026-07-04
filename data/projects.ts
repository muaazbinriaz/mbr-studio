/**
 * CONTENT-COMPLETENESS NOTE: each project below is a REAL, shipped
 * project — only the case-study write-up sub-fields (`problem`,
 * `solution`, `outcome`) are sometimes incomplete. That's fine and
 * expected: app/(marketing)/case-studies/[slug]/page.tsx already falls
 * back to "we're finalizing this write-up" copy per missing field, and
 * the project still appears normally in FeaturedProjects/PortfolioGrid
 * regardless (intentional — an incomplete write-up doesn't mean the
 * project itself isn't real). Add real `problem`/`solution`/`outcome`
 * text here as case studies get written up; don't invent plausible-
 * sounding metrics or narrative to fill these fields early.
 */
import type { Project } from "@/types";
import type { BusinessType } from "@/lib/chat/estimator";

export const projects: Project[] = [
  {
    slug: "lumiere-skin-clinic",
    title: "Lumière Skin Clinic Website",
    client: "Lumière Skin Clinic, Rawalpindi",
    industry: "Healthcare / Aesthetic Clinic",
    summary:
      "A full-stack web application for Lumière Skin Clinic, delivering a complete digital presence with AI chatbot, online booking, and admin dashboard. Built with Next.js, TypeScript, and MongoDB.",
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
    category: "Website",
    link: "https://skin-clinic.vercel.app",
  },

  {
    slug: "jobmatch-ai-job-matching",
    title: "JobMatch — AI-Powered CV Analysis & Job Matching",
    client: "Personal / SaaS Project",
    industry: "Startup / SaaS",
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
  },

  {
    slug: "mern-trello-task-board",
    title: "MERN Trello-Style Collaborative Task Board",
    client: "Personal / SaaS Project",
    industry: "Startup / SaaS",
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
  },
];

export function searchProjects(
  category?: BusinessType,
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
