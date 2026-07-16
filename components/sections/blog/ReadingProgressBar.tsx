"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * Thin fixed progress bar tracking scroll position through the article
 * body specifically (not the whole page), so it reaches 100% right as
 * the reader finishes the content rather than the CTA/newsletter footer.
 */
export function ReadingProgressBar({
  targetId = "article-content",
}: {
  targetId?: string;
}) {
  const [progress, setProgress] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const target = document.getElementById(targetId);
    if (!target) return;

    function onScroll() {
      if (!target) return;
      const rect = target.getBoundingClientRect();
      const totalScrollable = rect.height - window.innerHeight;
      const scrolled = -rect.top;
      const pct =
        totalScrollable > 0
          ? Math.min(100, Math.max(0, (scrolled / totalScrollable) * 100))
          : 0;
      setProgress(pct);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [targetId]);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-x-0 top-0 z-50 h-1 bg-transparent"
    >
      <motion.div
        className="h-full bg-gradient-to-r from-primary to-accent"
        style={{ width: `${progress}%` }}
        transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.1 }}
      />
    </div>
  );
}
