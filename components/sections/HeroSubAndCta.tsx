// components/sections/HeroSubAndCta.tsx
"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeroSubAndCta() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <>
      <motion.p
        initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mt-6 max-w-2xl font-body text-base text-secondary-text
 sm:text-lg md:text-xl"
      >
        MBR Studio designs, builds, and automates digital products for founders
        who need results — not just deliverables.
      </motion.p>

      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center"
      >
        <Button
          asChild
          size="lg"
          className="group rounded-lg bg-primary px-7 py-6 text-base font-medium text-white hover:bg-primary/90"
        >
          <Link href="/contact">
            Book a Free Consultation
            <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </Button>

        <Button
          asChild
          variant="ghost"
          size="lg"
          className="group rounded-lg border border-border px-7 py-6 text-base font-medium text-text hover:bg-card"
        >
          <Link href="/portfolio">
            <PlayCircle className="mr-2 h-4 w-4" />
            View Our Work
          </Link>
        </Button>
      </motion.div>
    </>
  );
}
