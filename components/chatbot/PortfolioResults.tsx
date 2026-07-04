import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { Project } from "@/types";

export interface PortfolioSearchOutput {
  count: number;
  projects: Project[];
}

export function PortfolioResults({
  result,
}: {
  result: PortfolioSearchOutput;
}) {
  if (!result.projects || result.projects.length === 0) {
    return (
      <div className="ml-9 max-w-[85%] rounded-2xl border border-border bg-card px-4 py-2.5 font-body text-sm text-muted-foreground">
        No matching projects found — check the full{" "}
        <Link href="/portfolio" className="text-primary underline">
          portfolio
        </Link>{" "}
        for more.
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="ml-9 flex max-w-[92%] flex-col gap-2"
    >
      {result.projects.map((project) => (
        <Link
          key={project.slug}
          href={`/case-studies/${project.slug}`}
          className="group flex items-center gap-3 rounded-xl border border-border bg-card p-2.5 transition-colors hover:border-primary/50"
        >
          <div className="relative h-12 w-16 flex-none overflow-hidden rounded-lg bg-secondary-background">
            <Image
              src={project.image}
              alt={project.title}
              fill
              sizes="64px"
              className="object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-body text-sm font-medium text-foreground">
              {project.title}
            </p>
            <p className="truncate font-body text-xs text-muted-foreground">
              {project.client}
            </p>
          </div>
          <ArrowRight className="h-3.5 w-3.5 flex-none text-primary transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      ))}
    </motion.div>
  );
}
